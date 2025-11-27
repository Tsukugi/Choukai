import { Map as GameMap } from './Map';
import { Position } from './Position';
import type { IPosition, IUnitPosition } from '../types/positionTypes';

/**
 * World class manages multiple maps and unit positioning across them
 */
export class World {
  private maps: GameMap[] = [];
  private unitPositions: Map<string, { mapId: string; position: Position }> =
    new Map<string, { mapId: string; position: Position }>();

  constructor() {
    // Initialize the world
  }

  /**
   * Add a map to the world
   */
  addMap(map: GameMap): boolean {
    // Check if a map with this name already exists
    if (this.maps.some(m => m.name === map.name)) {
      return false;
    }

    this.maps.push(map);
    return true;
  }

  /**
   * Get a map by name
   */
  getMap(name: string): GameMap {
    const map = this.maps.find(map => map.name === name);
    if (!map) {
      throw new Error(`Map with name ${name} does not exist in the world`);
    }
    return map;
  }

  /**
   * Remove a map by name
   */
  removeMap(name: string): boolean {
    const index = this.maps.findIndex(map => map.name === name);
    if (index === -1) {
      return false;
    }

    // Remove all units that were on this map
    for (const [unitId, pos] of this.unitPositions.entries()) {
      if (pos.mapId === name) {
        this.unitPositions.delete(unitId);
      }
    }

    this.maps.splice(index, 1);
    return true;
  }

  /**
   * Get all maps in the world
   */
  getAllMaps(): GameMap[] {
    return [...this.maps];
  }

  /**
   * Get the position of a unit in the world
   */
  getUnitPosition(unitId: string): IUnitPosition {
    const position = this.unitPositions.get(unitId);
    if (!position) {
      throw new Error(`Unit with ID ${unitId} does not exist in the world`);
    }
    // Add the unitId to match the IUnitPosition interface
    return {
      unitId,
      mapId: position.mapId,
      position: position.position
    };
  }

  /**
   * Set the position of a unit in the world
   */
  setUnitPosition(unitId: string, mapId: string, position: IPosition): boolean {
    // Check if the map exists first to avoid throwing an error
    if (!this.maps.some(m => m.name === mapId)) {
      return false;
    }

    const map = this.getMap(mapId);

    // Check if the unit can be placed at this position
    if (!map.canPlaceUnitAt(position.x, position.y)) {
      return false;
    }

    // Remove the unit from its current position if it exists
    const currentPos = this.unitPositions.get(unitId);
    if (currentPos) {
      // For current map, we know it should exist if the unit position was valid
      try {
        const currentMap = this.getMap(currentPos.mapId);
        currentMap.removeUnit(currentPos.position.x, currentPos.position.y);
      } catch {
        // If for some reason the old map doesn't exist, just continue
      }
    }

    // Place the unit at the new position
    if (!map.placeUnit(unitId, position.x, position.y)) {
      return false;
    }

    // Update the unit's position in the world
    this.unitPositions.set(unitId, {
      mapId,
      position: new Position(position.x, position.y, position.z),
    });

    return true;
  }

  /**
   * Remove a unit from the world
   */
  removeUnit(unitId: string): boolean {
    const currentPos = this.unitPositions.get(unitId);
    if (!currentPos) {
      return false;
    }

    // Remove the unit from the map
    try {
      const map = this.getMap(currentPos.mapId);
      map.removeUnit(currentPos.position.x, currentPos.position.y);
    } catch {
      // If the map doesn't exist, continue anyway
    }

    // Remove from the world's tracking
    this.unitPositions.delete(unitId);
    return true;
  }

  /**
   * Move a unit to a new position on the same map
   */
  moveUnit(unitId: string, newX: number, newY: number): boolean {
    const currentPos = this.unitPositions.get(unitId);
    if (!currentPos) {
      return false;
    }

    // Try to move the unit on the same map
    let map;
    try {
      map = this.getMap(currentPos.mapId);
    } catch {
      return false; // Map doesn't exist
    }

    // Check if the new position is valid
    if (!map.canPlaceUnitAt(newX, newY)) {
      return false;
    }

    // Remove from current position
    map.removeUnit(currentPos.position.x, currentPos.position.y);

    // Place at new position
    if (!map.placeUnit(unitId, newX, newY)) {
      // If placing at new position fails, put back at old position
      map.placeUnit(unitId, currentPos.position.x, currentPos.position.y);
      return false;
    }

    // Update the unit's position in the world
    this.unitPositions.set(unitId, {
      mapId: currentPos.mapId,
      position: new Position(newX, newY, currentPos.position.z),
    });

    return true;
  }

  /**
   * Move a unit to a different map
   */
  moveUnitToMap(
    unitId: string,
    newMapId: string,
    newX: number,
    newY: number
  ): boolean {
    const currentPos = this.unitPositions.get(unitId);
    if (!currentPos) {
      return false;
    }

    // Check if the new map exists first
    if (!this.maps.some(m => m.name === newMapId)) {
      return false;
    }
    const newMap = this.getMap(newMapId);

    // Check if the new position is valid
    if (!newMap.canPlaceUnitAt(newX, newY)) {
      return false;
    }

    // Remove from current map
    try {
      const currentMap = this.getMap(currentPos.mapId);
      currentMap.removeUnit(currentPos.position.x, currentPos.position.y);
    } catch {
      // If the old map doesn't exist, we can't remove the unit from it
      return false;
    }

    // Place on new map
    if (!newMap.placeUnit(unitId, newX, newY)) {
      // If placement fails, try to put back on old map
      try {
        const currentMap = this.getMap(currentPos.mapId);
        currentMap.placeUnit(
          unitId,
          currentPos.position.x,
          currentPos.position.y
        );
      } catch {
        // If we can't restore to the old map either, just continue
      }
      return false;
    }

    // Update the unit's position in the world
    this.unitPositions.set(unitId, {
      mapId: newMapId,
      position: new Position(newX, newY),
    });

    return true;
  }

  /**
   * Get the distance between two units in the world
   */
  getDistanceBetweenUnits(unit1Id: string, unit2Id: string): number {
    let pos1, pos2;
    try {
      pos1 = this.getUnitPosition(unit1Id);
    } catch {
      throw new Error(`Cannot calculate distance: unit ${unit1Id} does not exist`);
    }
    try {
      pos2 = this.getUnitPosition(unit2Id);
    } catch {
      throw new Error(`Cannot calculate distance: unit ${unit2Id} does not exist`);
    }

    // If units are on different maps, we can't calculate distance
    if (pos1.mapId !== pos2.mapId)
      throw new Error('Units are on different maps');

    return pos1.position.distanceTo(pos2.position);
  }

  /**
   * Get all units in the world
   */
  getAllUnits(): Array<IUnitPosition> {
    const units: Array<IUnitPosition> = [];

    for (const [unitId, pos] of this.unitPositions.entries()) {
      units.push({
        unitId,
        mapId: pos.mapId,
        position: pos.position,
      });
    }

    return units;
  }

  /**
   * Get all units on a specific map
   */
  getUnitsOnMap(mapId: string): Array<IUnitPosition> {
    const units: Array<IUnitPosition> = [];

    for (const [unitId, pos] of this.unitPositions.entries()) {
      if (pos.mapId === mapId) {
        units.push({
          unitId,
          mapId: pos.mapId,
          position: pos.position,
        });
      }
    }

    return units;
  }

  /**
   * Check if two units are adjacent on the same map
   */
  areUnitsAdjacent(
    unit1Id: string,
    unit2Id: string,
    allowDiagonal: boolean = true
  ): boolean {
    let pos1, pos2;
    try {
      pos1 = this.getUnitPosition(unit1Id);
    } catch {
      throw new Error(`Cannot check adjacency: unit ${unit1Id} does not exist`);
    }
    try {
      pos2 = this.getUnitPosition(unit2Id);
    } catch {
      throw new Error(`Cannot check adjacency: unit ${unit2Id} does not exist`);
    }

    // If units are on different maps, they cannot be adjacent
    if (pos1.mapId !== pos2.mapId) {
      return false; // Units on different maps cannot be adjacent
    }

    return pos1.position.isAdjacentTo(pos2.position, allowDiagonal);
  }

  /**
   * Clear the world of all maps and units
   */
  clear(): void {
    this.maps = [];
    this.unitPositions.clear();
  }
}
