import { describe, it, expect, beforeEach } from 'vitest';
import { Map } from '../src/core/Map';
import { Position } from '../src/core/Position';

describe('Map - Extended functionality', () => {
  it('should properly handle edge wrapping when wrapEdges is enabled', () => {
    const map = new Map(5, 5, 'Wrapped Map', { wrapEdges: true });
    
    // Setting terrain on wrapped coordinates should work
    map.setTerrain(-1, -1, 'grass'); // Should wrap to (4, 4)
    expect(map.getTerrain(-1, -1)).toBe('grass');
    
    map.setTerrain(5, 5, 'water'); // Should wrap to (0, 0)
    expect(map.getTerrain(5, 5)).toBe('water');
    
    // Coordinates should wrap correctly
    expect(map.getTerrain(0, 0)).toBe('water'); // 5,5 wrapped to 0,0
    expect(map.getTerrain(4, 4)).toBe('grass'); // -1,-1 wrapped to 4,4
  });

  it('should get region correctly', () => {
    const map = new Map(10, 10, 'Test Map');
    
    // Set some specific terrain in a region
    map.setTerrain(2, 2, 'water');
    map.setTerrain(3, 2, 'mountain');
    map.setTerrain(2, 3, 'forest');
    
    // Get a 3x3 region starting at (1,1)
    const region = map.getRegion(1, 1, 3, 3);
    
    expect(region.length).toBe(3); // 3 rows
    expect(region[0]!.length).toBe(3); // 3 columns
    
    // Check that the specific terrains are in the right spots
    expect(region[1]![1]?.terrain).toBe('water'); // (2,2) -> (1,1) in region
    expect(region[1]![2]?.terrain).toBe('mountain'); // (3,2) -> (2,1) in region
    expect(region[2]![1]?.terrain).toBe('forest'); // (2,3) -> (1,2) in region
  });

  it('should handle out of bounds region requests', () => {
    const map = new Map(5, 5, 'Small Map');
    
    // Request a region that goes beyond map bounds
    const region = map.getRegion(3, 3, 4, 4);
    
    // Should return a 4x4 region with default terrain for out-of-bounds cells
    expect(region.length).toBe(4);
    expect(region[0]!.length).toBe(4);
    
    // All cells should exist, with out-of-bounds filled with default terrain
    for (let y = 0; y < region.length; y++) {
      for (let x = 0; x < region[y]!.length; x++) {
        expect(region[y]![x]).toBeDefined();
      }
    }
  });

  it('should return Infinity for movement cost on invalid coordinates', () => {
    const map = new Map(5, 5, 'Test Map');
    
    const cost = map.getMovementCost(10, 10); // Out of bounds
    expect(cost).toBe(Infinity);
  });

  it('should handle resize properly', () => {
    const map = new Map(5, 5, 'Test Map');
    
    // Set some terrain in the original map
    map.setTerrain(2, 2, 'water');
    
    // Resize to larger
    map.resize(8, 8);
    expect(map.width).toBe(8);
    expect(map.height).toBe(8);
    
    // The original terrain should still be there
    expect(map.getTerrain(2, 2)).toBe('water');
    
    // Resize to smaller
    map.resize(3, 3);
    expect(map.width).toBe(3);
    expect(map.height).toBe(3);
    
    // The terrain at (2,2) should still exist
    expect(map.getTerrain(2, 2)).toBe('water');
    
    // But terrain beyond the new size should not exist
    expect(map.getCell(3, 3)).toBeNull();
  });

  it('should throw error on invalid resize dimensions', () => {
    const map = new Map(5, 5, 'Test Map');
    
    expect(() => {
      map.resize(0, 5);
    }).toThrow('Map dimensions must be positive');
    
    expect(() => {
      map.resize(5, 0);
    }).toThrow('Map dimensions must be positive');
    
    expect(() => {
      map.resize(-1, 5);
    }).toThrow('Map dimensions must be positive');
  });

  it('should clone map with custom name', () => {
    const map = new Map(5, 5, 'Original Map');
    map.setTerrain(2, 2, 'plains'); // Use walkable terrain

    const clonedMap = map.clone('Cloned Map');
    expect(clonedMap.name).toBe('Cloned Map');
    expect(clonedMap.width).toBe(map.width);
    expect(clonedMap.height).toBe(map.height);
    expect(clonedMap.getTerrain(2, 2)).toBe('plains');
  });

  it('should get terrain properties correctly', () => {
    const map = new Map(5, 5, 'Test Map');
    
    map.setTerrain(1, 1, 'forest', { movementCost: 2.5, visibilityModifier: 0.5 });
    
    const properties = map.getTerrainProperties(1, 1);
    expect(properties).toBeDefined();
    expect(properties?.movementCost).toBe(2.5);
    expect(properties?.visibilityModifier).toBe(0.5);
    
    // Get properties for out-of-bounds position
    const invalidProperties = map.getTerrainProperties(10, 10);
    expect(invalidProperties).toBeNull();
  });

  it('should correctly get nearby cells with diagonal settings', () => {
    const map = new Map(10, 10, 'Test Map');
    
    // Set some terrain around position (5,5)
    map.setTerrain(4, 5, 'water');
    map.setTerrain(6, 5, 'mountain');
    
    // Get nearby cells with diagonals allowed (default)
    const nearbyWithDiagonals = map.getNearbyCells(5, 5, 1, true);
    expect(nearbyWithDiagonals.length).toBe(8); // All adjacent cells including diagonals
    
    // Get nearby cells with diagonals disabled
    const nearbyWithoutDiagonals = map.getNearbyCells(5, 5, 1, false);
    expect(nearbyWithoutDiagonals.length).toBe(4); // Only horizontal/vertical
    
    // Check that diagonals are excluded when disabled
    const positions = nearbyWithoutDiagonals.map(cell => ({x: cell.x, y: cell.y}));
    expect(positions).toContainEqual({x: 4, y: 5}); // Left
    expect(positions).toContainEqual({x: 6, y: 5}); // Right
    expect(positions).toContainEqual({x: 5, y: 4}); // Up
    expect(positions).toContainEqual({x: 5, y: 6}); // Down
    
    // Diagonal positions should not be included
    expect(positions).not.toContainEqual({x: 4, y: 4}); // Top-left diagonal
    expect(positions).not.toContainEqual({x: 6, y: 6}); // Bottom-right diagonal
  });
});

describe('Position - Extended functionality', () => {
  it('should calculate direction to another position', () => {
    const pos1 = new Position(0, 0);
    const pos2 = new Position(3, 4);
    
    const direction = pos1.directionTo(pos2);
    expect(direction.x).toBeCloseTo(0.6); // 3/5
    expect(direction.y).toBeCloseTo(0.8); // 4/5
    
    // Test with 3D positions
    const pos3d1 = new Position(0, 0, 0);
    const pos3d2 = new Position(3, 4, 0);
    
    const direction3d = pos3d1.directionTo(pos3d2);
    expect(direction3d.x).toBeCloseTo(0.6);
    expect(direction3d.y).toBeCloseTo(0.8);
    expect(direction3d.z).toBe(0);
    
    // Test with zero distance
    const sameDirection = pos1.directionTo(pos1);
    expect(sameDirection.x).toBe(0);
    expect(sameDirection.y).toBe(0);
  });

  it('should calculate offset position', () => {
    const pos = new Position(5, 10);
    
    const offsetPos = pos.offset(2, -3);
    expect(offsetPos.x).toBe(7);
    expect(offsetPos.y).toBe(7);
    expect(offsetPos.z).toBeUndefined();
    
    // Test with z offset
    const pos3d = new Position(5, 10, 3);
    const offsetPos3d = pos3d.offset(2, -3, 1);
    expect(offsetPos3d.x).toBe(7);
    expect(offsetPos3d.y).toBe(7);
    expect(offsetPos3d.z).toBe(4);
  });

  it('should create position from string', () => {
    // Test 2D position
    const pos2d = Position.fromString('(5, 10)');
    expect(pos2d.x).toBe(5);
    expect(pos2d.y).toBe(10);
    expect(pos2d.z).toBeUndefined();
    
    // Test 3D position
    const pos3d = Position.fromString('(5, 10, 3)');
    expect(pos3d.x).toBe(5);
    expect(pos3d.y).toBe(10);
    expect(pos3d.z).toBe(3);
    
    // Test with spaces
    const posWithSpaces = Position.fromString('( 5 , 10 , 3 )');
    expect(posWithSpaces.x).toBe(5);
    expect(posWithSpaces.y).toBe(10);
    expect(posWithSpaces.z).toBe(3);
    
    // Test invalid string
    expect(() => {
      Position.fromString('invalid');
    }).toThrow('Invalid position string: invalid');
  });

  it('should clone position with z-coordinate', () => {
    // Test 2D clone
    const pos2d = new Position(5, 10);
    const cloned2d = pos2d.clone();
    expect(cloned2d.x).toBe(5);
    expect(cloned2d.y).toBe(10);
    expect(cloned2d.z).toBeUndefined();
    expect(cloned2d).not.toBe(pos2d); // Should be different object
    
    // Test 3D clone
    const pos3d = new Position(5, 10, 3);
    const cloned3d = pos3d.clone();
    expect(cloned3d.x).toBe(5);
    expect(cloned3d.y).toBe(10);
    expect(cloned3d.z).toBe(3);
    expect(cloned3d).not.toBe(pos3d); // Should be different object
  });
});