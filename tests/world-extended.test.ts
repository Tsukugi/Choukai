import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/core/World';
import { Map } from '../src/core/Map';
import { Position } from '../src/core/Position';

describe('World - Extended functionality', () => {
  let world: World;
  let testMap: Map;

  beforeEach(() => {
    world = new World();
    testMap = new Map(10, 10, 'Test Map');
    world.addMap(testMap);
  });

  it('should handle units with z-coordinates properly', () => {
    // Set a unit with z-coordinate
    const positionWithZ = new Position(5, 5, 2);
    const success = world.setUnitPosition('unit-3d', 'Test Map', positionWithZ);
    expect(success).toBe(true);

    const retrievedPosition = world.getUnitPosition('unit-3d');
    expect(retrievedPosition).toBeDefined();
    expect(retrievedPosition?.position.x).toBe(5);
    expect(retrievedPosition?.position.y).toBe(5);
    expect(retrievedPosition?.position.z).toBe(2);

    // Move the unit and verify z-coordinate is preserved
    const moved = world.moveUnit('unit-3d', 6, 6); // Only x,y change
    expect(moved).toBe(true);

    const newPosition = world.getUnitPosition('unit-3d');
    expect(newPosition?.position.x).toBe(6);
    expect(newPosition?.position.y).toBe(6);
    expect(newPosition?.position.z).toBe(2); // z-coordinate should be preserved
  });

  it('should handle removal of units when removing a map', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    world.setUnitPosition('unit-2', 'Test Map', { x: 6, y: 6 });

    // Add another map
    const secondMap = new Map(10, 10, 'Second Map');
    world.addMap(secondMap);
    world.setUnitPosition('unit-3', 'Second Map', { x: 1, y: 1 });

    // Remove the first map
    const removed = world.removeMap('Test Map');
    expect(removed).toBe(true);

    // All units from the removed map should be gone
    expect(world.getUnitPosition('unit-1')).toBeUndefined();
    expect(world.getUnitPosition('unit-2')).toBeUndefined();
    
    // Unit on the second map should still exist
    expect(world.getUnitPosition('unit-3')).toBeDefined();

    // The map should no longer exist
    expect(world.getMap('Test Map')).toBeUndefined();
  });

  it('should return correct results for adjacent units with different diagonal options', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    world.setUnitPosition('unit-2', 'Test Map', { x: 6, y: 6 }); // Diagonal to unit-1

    // With diagonals allowed, should be adjacent
    const adjacentWithDiagonal = world.areUnitsAdjacent('unit-1', 'unit-2', true);
    expect(adjacentWithDiagonal).toBe(true);

    // With diagonals disallowed, should not be adjacent
    const adjacentWithoutDiagonal = world.areUnitsAdjacent('unit-1', 'unit-2', false);
    expect(adjacentWithoutDiagonal).toBe(false);
  });

  it('should handle moveUnitToMap failures gracefully', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });

    // Try to move to a non-existent map
    const failedMove = world.moveUnitToMap('unit-1', 'NonExistent Map', 3, 3);
    expect(failedMove).toBe(false);

    // Unit should remain on original map
    const position = world.getUnitPosition('unit-1');
    expect(position?.mapId).toBe('Test Map');
    expect(position?.position.x).toBe(5);
    expect(position?.position.y).toBe(5);

    // Add a new map but try to place on occupied position
    const targetMap = new Map(10, 10, 'Target Map');
    world.addMap(targetMap);

    // Place a unit at (3,3) on target map
    world.setUnitPosition('unit-2', 'Target Map', { x: 3, y: 3 });

    // Try to move unit-1 to same position as unit-2
    const failedMove2 = world.moveUnitToMap('unit-1', 'Target Map', 3, 3);
    expect(failedMove2).toBe(false);

    // unit-1 should still be on original map
    const unit1Pos = world.getUnitPosition('unit-1');
    expect(unit1Pos?.mapId).toBe('Test Map');
    expect(unit1Pos?.position.x).toBe(5);
    expect(unit1Pos?.position.y).toBe(5);

    // unit-2 should still be on target map
    const unit2Pos = world.getUnitPosition('unit-2');
    expect(unit2Pos?.mapId).toBe('Target Map');
    expect(unit2Pos?.position.x).toBe(3);
    expect(unit2Pos?.position.y).toBe(3);
  });

  it('should handle edge cases with map operations', () => {
    // Try to get a non-existent map
    expect(world.getMap('NonExistent Map')).toBeUndefined();

    // Try to remove a non-existent map
    expect(world.removeMap('NonExistent Map')).toBe(false);

    // Try to get units on a non-existent map
    expect(world.getUnitsOnMap('NonExistent Map')).toEqual([]);

    // Try operations on non-existent units
    expect(world.getUnitPosition('NonExistentUnit')).toBeUndefined();
    expect(world.removeUnit('NonExistentUnit')).toBe(false);
    expect(world.moveUnit('NonExistentUnit', 5, 5)).toBe(false);
    expect(world.moveUnitToMap('NonExistentUnit', 'Test Map', 5, 5)).toBe(false);
    expect(world.getDistanceBetweenUnits('NonExistentUnit', 'AnotherUnit')).toBeNull();
    expect(world.areUnitsAdjacent('NonExistentUnit', 'AnotherUnit')).toBeNull();
  });
});