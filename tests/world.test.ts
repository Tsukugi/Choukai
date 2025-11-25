import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/core/World';
import { Map } from '../src/core/Map';
import { Position } from '../src/core/Position';

describe('World', () => {
  let world: World;
  let testMap: Map;

  beforeEach(() => {
    world = new World();
    testMap = new Map(10, 10, 'Test Map');
    world.addMap(testMap);
  });

  it('should add and get a map', () => {
    const newMap = new Map(5, 5, 'New Map');
    const added = world.addMap(newMap);
    expect(added).toBe(true);
    
    const retrievedMap = world.getMap('New Map');
    expect(retrievedMap).not.toBeUndefined();
    expect(retrievedMap?.name).toBe('New Map');
  });

  it('should not add maps with duplicate names', () => {
    const map1 = new Map(5, 5, 'Same Name');
    const map2 = new Map(7, 7, 'Same Name'); // Same name as map1
    
    const added1 = world.addMap(map1);
    const added2 = world.addMap(map2);
    
    expect(added1).toBe(true);
    expect(added2).toBe(false); // Should fail due to duplicate name
  });

  it('should remove a map', () => {
    const newMap = new Map(5, 5, 'ToRemove Map');
    world.addMap(newMap);
    
    expect(world.getMap('ToRemove Map')).not.toBeUndefined();
    
    const removed = world.removeMap('ToRemove Map');
    expect(removed).toBe(true);
    expect(world.getMap('ToRemove Map')).toBeUndefined();
  });

  it('should set and get unit position', () => {
    const success = world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    expect(success).toBe(true);
    
    const position = world.getUnitPosition('unit-1');
    expect(position).not.toBeUndefined();
    expect(position?.mapId).toBe('Test Map');
    expect(position?.position.x).toBe(5);
    expect(position?.position.y).toBe(5);
  });

  it('should fail to set unit position on invalid map', () => {
    const success = world.setUnitPosition('unit-1', 'NonExistent Map', { x: 5, y: 5 });
    expect(success).toBe(false);
  });

  it('should fail to set unit position on occupied cell', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    // Try to place another unit at the same position
    const success = world.setUnitPosition('unit-2', 'Test Map', { x: 5, y: 5 });
    expect(success).toBe(false);
  });

  it('should move a unit within the same map', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    const moved = world.moveUnit('unit-1', 6, 6);
    expect(moved).toBe(true);
    
    const newPos = world.getUnitPosition('unit-1');
    expect(newPos?.position.x).toBe(6);
    expect(newPos?.position.y).toBe(6);
  });

  it('should move a unit to a different map', () => {
    const newMap = new Map(10, 10, 'Second Map');
    world.addMap(newMap);
    
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    const moved = world.moveUnitToMap('unit-1', 'Second Map', 3, 3);
    expect(moved).toBe(true);
    
    const newPos = world.getUnitPosition('unit-1');
    expect(newPos?.mapId).toBe('Second Map');
    expect(newPos?.position.x).toBe(3);
    expect(newPos?.position.y).toBe(3);
  });

  it('should remove a unit', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    const removed = world.removeUnit('unit-1');
    expect(removed).toBe(true);
    
    const position = world.getUnitPosition('unit-1');
    expect(position).toBeUndefined();
  });

  it('should get all units in the world', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    world.setUnitPosition('unit-2', 'Test Map', { x: 6, y: 6 });
    
    const units = world.getAllUnits();
    expect(units.length).toBe(2);
    
    const unitIds = units.map(u => u.unitId);
    expect(unitIds).toContain('unit-1');
    expect(unitIds).toContain('unit-2');
  });

  it('should get units on a specific map', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    world.setUnitPosition('unit-2', 'Test Map', { x: 6, y: 6 });
    
    // Add another map with a unit
    const secondMap = new Map(10, 10, 'Second Map');
    world.addMap(secondMap);
    world.setUnitPosition('unit-3', 'Second Map', { x: 1, y: 1 });
    
    const unitsOnTestMap = world.getUnitsOnMap('Test Map');
    expect(unitsOnTestMap.length).toBe(2);
    
    const unitIds = unitsOnTestMap.map(u => u.unitId);
    expect(unitIds).toContain('unit-1');
    expect(unitIds).toContain('unit-2');
  });

  it('should calculate distance between units', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 0, y: 0 });
    world.setUnitPosition('unit-2', 'Test Map', { x: 3, y: 4 });
    
    const distance = world.getDistanceBetweenUnits('unit-1', 'unit-2');
    expect(distance).toBe(5); // 3-4-5 triangle
  });

  it('should return null for distance between units on different maps', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 0, y: 0 });
    
    const secondMap = new Map(10, 10, 'Second Map');
    world.addMap(secondMap);
    world.setUnitPosition('unit-2', 'Second Map', { x: 10, y: 10 });
    
    const distance = world.getDistanceBetweenUnits('unit-1', 'unit-2');
    expect(distance).toBeNull();
  });

  it('should check if units are adjacent', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    world.setUnitPosition('unit-2', 'Test Map', { x: 6, y: 5 }); // Adjacent
    
    const adjacent = world.areUnitsAdjacent('unit-1', 'unit-2');
    expect(adjacent).toBe(true);
  });

  it('should return null for adjacency check if one or both units don\'t exist', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    // unit-2 doesn't exist
    const adjacent = world.areUnitsAdjacent('unit-1', 'unit-2');
    expect(adjacent).toBeNull();
  });

  it('should return false for adjacency check if units are on different maps', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    const secondMap = new Map(10, 10, 'Second Map');
    world.addMap(secondMap);
    world.setUnitPosition('unit-2', 'Second Map', { x: 6, y: 5 });
    
    const adjacent = world.areUnitsAdjacent('unit-1', 'unit-2');
    expect(adjacent).toBe(false);
  });

  it('should clear the world', () => {
    world.setUnitPosition('unit-1', 'Test Map', { x: 5, y: 5 });
    
    const secondMap = new Map(10, 10, 'Second Map');
    world.addMap(secondMap);
    
    world.clear();
    
    expect(world.getAllMaps().length).toBe(0);
    expect(world.getAllUnits().length).toBe(0);
    expect(world.getUnitPosition('unit-1')).toBeUndefined();
  });
});