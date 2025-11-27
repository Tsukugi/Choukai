import { describe, it, expect, beforeEach } from 'vitest';
import { Map } from '../src/core/Map';
import { Position } from '../src/core/Position';

describe('Map', () => {
  let map: Map;

  beforeEach(() => {
    map = new Map(10, 10, 'Test Map');
  });

  it('should create a map with specified dimensions', () => {
    expect(map.width).toBe(10);
    expect(map.height).toBe(10);
    expect(map.name).toBe('Test Map');
  });

  it('should initialize with default terrain', () => {
    const cell = map.getCell(0, 0);
    expect(cell).not.toBeNull();
    expect(cell?.terrain).toBe('grass'); // Default terrain
  });

  it('should set and get terrain correctly', () => {
    map.setTerrain(5, 5, 'water');
    const terrain = map.getTerrain(5, 5);
    expect(terrain).toBe('water');
  });

  it('should return null for out of bounds coordinates', () => {
    const cell = map.getCell(15, 15); // Outside map bounds
    expect(cell).toBeNull();
  });

  it('should check if positions are walkable', () => {
    // Initially, most positions should be walkable
    expect(map.isWalkable(5, 5)).toBe(true);

    // Set a blocking terrain
    map.setTerrain(5, 5, 'grass', { impassable: true });
    expect(map.isWalkable(5, 5)).toBe(false);
  });

  it('should place and remove units correctly', () => {
    // Initially position should be empty
    expect(map.getUnitAt(5, 5)).toBeUndefined();
    
    // Place a unit
    const placed = map.placeUnit('unit-1', 5, 5);
    expect(placed).toBe(true);
    expect(map.getUnitAt(5, 5)).toBe('unit-1');
    
    // Position should no longer be walkable
    expect(map.isWalkable(5, 5)).toBe(false);
    
    // Remove the unit
    const removed = map.removeUnit(5, 5);
    expect(removed).toBe(true);
    expect(map.getUnitAt(5, 5)).toBeUndefined();
    
    // Position should be walkable again
    expect(map.isWalkable(5, 5)).toBe(true);
  });

  it('should prevent placing units on occupied positions', () => {
    map.placeUnit('unit-1', 5, 5);
    
    // Try to place another unit at the same position
    const result = map.canPlaceUnitAt(5, 5);
    expect(result).toBe(false);
  });

  it('should get all units on the map', () => {
    map.placeUnit('unit-1', 1, 1);
    map.placeUnit('unit-2', 2, 2);
    
    const units = map.getAllUnits();
    expect(units.length).toBe(2);
    
    const unitIds = units.map(u => u.unitId);
    expect(unitIds).toContain('unit-1');
    expect(unitIds).toContain('unit-2');
  });

  it('should get nearby cells correctly', () => {
    // Set some terrain around position (5, 5)
    map.setTerrain(4, 5, 'water');
    map.setTerrain(6, 5, 'mountain');
    
    const nearby = map.getNearbyCells(5, 5, 1);
    // Should have 8 adjacent cells in a 3x3 grid minus the center
    expect(nearby.length).toBe(8);
    
    // Check that the nearby cells include the ones we set
    const nearbyCoords = nearby.map(cell => ({ x: cell.x, y: cell.y }));
    expect(nearbyCoords).toContainEqual({ x: 4, y: 5 });
    expect(nearbyCoords).toContainEqual({ x: 6, y: 5 });
  });

  it('should get movement cost for terrain', () => {
    map.setTerrain(5, 5, 'water'); // Water has movement cost of 2.0 by default
    const cost = map.getMovementCost(5, 5);
    expect(cost).toBe(2.0);
  });

  it('should resize the map', () => {
    map.resize(15, 15);
    expect(map.width).toBe(15);
    expect(map.height).toBe(15);
  });

  it('should create a clone of the map', () => {
    map.setTerrain(5, 5, 'plains'); // Use terrain that allows units
    map.placeUnit('unit-1', 5, 5);

    const clonedMap = map.clone('Cloned Map');
    expect(clonedMap.name).toBe('Cloned Map');
    expect(clonedMap.width).toBe(map.width);
    expect(clonedMap.height).toBe(map.height);

    // Terrain should be copied
    expect(clonedMap.getTerrain(5, 5)).toBe('plains');

    // Units should be copied in the cell's occupiedBy property when cloning
    expect(clonedMap.getUnitAt(5, 5)).toBe('unit-1');
  });
});

describe('Position', () => {
  it('should create a position with x, y coordinates', () => {
    const pos = new Position(5, 10);
    expect(pos.x).toBe(5);
    expect(pos.y).toBe(10);
    expect(pos.z).toBeUndefined();
  });

  it('should create a 3D position with x, y, z coordinates', () => {
    const pos = new Position(5, 10, 3);
    expect(pos.x).toBe(5);
    expect(pos.y).toBe(10);
    expect(pos.z).toBe(3);
  });

  it('should calculate distance to another position', () => {
    const pos1 = new Position(0, 0);
    const pos2 = new Position(3, 4);
    expect(pos1.distanceTo(pos2)).toBe(5); // 3-4-5 triangle
  });

  it('should calculate Manhattan distance', () => {
    const pos1 = new Position(0, 0);
    const pos2 = new Position(3, 4);
    expect(pos1.manhattanDistanceTo(pos2)).toBe(7); // 3 + 4
  });

  it('should check if positions are adjacent', () => {
    const pos1 = new Position(5, 5);
    
    // Adjacent positions
    expect(pos1.isAdjacentTo(new Position(6, 5))).toBe(true); // right
    expect(pos1.isAdjacentTo(new Position(4, 5))).toBe(true); // left
    expect(pos1.isAdjacentTo(new Position(5, 6))).toBe(true); // up
    expect(pos1.isAdjacentTo(new Position(5, 4))).toBe(true); // down
    expect(pos1.isAdjacentTo(new Position(6, 6))).toBe(true); // diagonal
    
    // Non-adjacent positions
    expect(pos1.isAdjacentTo(new Position(7, 5))).toBe(false); // too far
    expect(pos1.isAdjacentTo(new Position(5, 5))).toBe(false); // same position
  });

  it('should clone a position', () => {
    const pos1 = new Position(5, 10, 3);
    const pos2 = pos1.clone();
    
    expect(pos2.x).toBe(5);
    expect(pos2.y).toBe(10);
    expect(pos2.z).toBe(3);
    
    // Should be a different object
    expect(pos1).not.toBe(pos2);
  });

  it('should convert position to and from string', () => {
    const pos = new Position(5, 10);
    const str = pos.toString();
    expect(str).toBe('(5, 10)');
    
    const parsedPos = Position.fromString(str);
    expect(parsedPos.x).toBe(5);
    expect(parsedPos.y).toBe(10);
  });

  it('should calculate offset position', () => {
    const pos = new Position(5, 10);
    const offsetPos = pos.offset(2, -3);
    
    expect(offsetPos.x).toBe(7);
    expect(offsetPos.y).toBe(7);
  });

  it('should check if positions are equal', () => {
    const pos1 = new Position(5, 10, 2);
    const pos2 = new Position(5, 10, 2);
    const pos3 = new Position(5, 10, 3);
    
    expect(pos1.equals(pos2)).toBe(true);
    expect(pos1.equals(pos3)).toBe(false);
  });
});