import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/core/World';
import { Map } from '../src/core/Map';

describe('World - Extended functionality', () => {
  let world: World;
  let testMap: Map;

  beforeEach(() => {
    world = new World();
    testMap = new Map(10, 10, 'Test Map');
    world.addMap(testMap);
  });

  it('should handle edge cases with map operations', () => {
    // Try to get a non-existent map
    expect(() => world.getMap('NonExistent Map')).toThrow();

    // Try to remove a non-existent map
    expect(world.removeMap('NonExistent Map')).toBe(false);
  });
});