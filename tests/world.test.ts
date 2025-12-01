import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/core/World';
import { Map } from '../src/core/Map';

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

    expect(() => world.getMap('ToRemove Map')).not.toThrow();

    const removed = world.removeMap('ToRemove Map');
    expect(removed).toBe(true);
    expect(() => world.getMap('ToRemove Map')).toThrow();
  });

  it('should clear the world', () => {
    const secondMap = new Map(10, 10, 'Second Map');
    world.addMap(secondMap);

    world.clear();

    expect(world.getAllMaps().length).toBe(0);
  });
});
