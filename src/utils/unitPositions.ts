import type { IPosition } from '../types/positionTypes';
import { Position } from '../core/Position';
import { World } from '../core/World';
import type { IUnitPosition } from '@atsu/atago';

/**
 * Compute a single-tile step from one position toward another, clamped to map bounds.
 */
export function stepTowards(
  world: World,
  mapId: string,
  from: IPosition,
  to: IPosition
): Position {
  const map = world.getAllMaps().find(m => m.name === mapId);
  const width = map?.width ?? from.x + 1;
  const height = map?.height ?? from.y + 1;

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  // Prefer moving along the axis with the greater distance
  let stepX = 0;
  let stepY = 0;
  if (Math.abs(dx) >= Math.abs(dy)) {
    stepX = Math.sign(dx);
  } else {
    stepY = Math.sign(dy);
  }

  const nextX = Math.min(Math.max(from.x + stepX, 0), width - 1);
  const nextY = Math.min(Math.max(from.y + stepY, 0), height - 1);

  return new Position(nextX, nextY, from.z);
}

/**
 * Get all position objects at a specific map coordinate
 */
export function getPositionsAtCoordinate<T extends IUnitPosition>(
  positions: T[],
  mapId: string,
  x: number,
  y: number
): T[] {
  return positions.filter(pos => {
    return pos.mapId === mapId && pos.position.x === x && pos.position.y === y;
  });
}

/**
 * Find any positions that have more than one position object at the same coordinate
 */
export function findCollisions<T extends IUnitPosition>(
  positions: T[]
): Array<{ mapId: string; x: number; y: number; positions: T[] }> {
  const collisions: Array<{
    mapId: string;
    x: number;
    y: number;
    positions: T[];
  }> = [];

  const seen: Record<string, T[]> = {};

  for (const pos of positions) {
    const key = `${pos.mapId}:${pos.position.x},${pos.position.y}`;
    if (!seen[key]) {
      seen[key] = [];
    }
    seen[key].push(pos);
  }

  for (const [key, occupants] of Object.entries(seen)) {
    if (occupants.length <= 1) {
      continue;
    }

    const parts = key.split(':');
    if (parts.length < 2) {
      continue; // Skip if key doesn't have the expected format
    }
    const [mapPart, coordPart] = parts;
    if (coordPart === undefined) {
      continue; // Skip if coordPart is undefined
    }
    const [xStr, yStr] = coordPart.split(',');
    if (xStr === undefined || yStr === undefined) {
      continue; // Skip if either part is undefined
    }

    collisions.push({
      mapId: mapPart!,
      x: Number(xStr),
      y: Number(yStr),
      positions: occupants,
    });
  }

  return collisions;
}

/**
 * Find the position object at a specific coordinate
 * @returns The position object at the specified coordinate, or undefined if no position is found
 */
export function getPositionAtCoordinate<T extends IUnitPosition>(
  positions: T[],
  mapId: string,
  x: number,
  y: number
): T | undefined {
  return positions.find(pos => {
    return pos.mapId === mapId && pos.position.x === x && pos.position.y === y;
  });
}

/**
 * Get all positions on a specific map
 * @returns Array of positions on the specified map
 */
export function getPositionsInMap<T extends IUnitPosition>(
  positions: T[],
  mapId: string
): T[] {
  return positions.filter(pos => {
    return pos.mapId === mapId;
  });
}

/**
 * Get all positions within a specific range of a reference position
 * @param positions Array of position objects to search through
 * @param world The world containing the maps
 * @param referencePosition The reference position
 * @param range The maximum distance range
 * @param useManhattanDistance Whether to use Manhattan distance (default: true)
 * @returns Array of positions within the specified range
 */
export function getPositionsWithinRange<T extends IUnitPosition>(
  positions: T[],
  _world: World,
  referencePosition: IUnitPosition,
  range: number,
  useManhattanDistance: boolean = true
): T[] {
  // Check if positions are on the same map
  const sameMapPositions = positions.filter(pos => {
    if (pos.unitId === referencePosition.unitId) return false; // Don't include the reference position itself

    return pos.mapId === referencePosition.mapId;
  });

  // Calculate distances and filter by range
  return sameMapPositions.filter(pos => {
    // Calculate distance between positions by creating new Position objects
    const refPos = new Position(
      referencePosition.position.x,
      referencePosition.position.y,
      referencePosition.position.z
    );
    const targetPos = new Position(
      pos.position.x,
      pos.position.y,
      pos.position.z
    );

    const distance = useManhattanDistance
      ? refPos.manhattanDistanceTo(targetPos)
      : refPos.distanceTo(targetPos);

    return distance <= range;
  });
}

/**
 * Calculate the distance between two position objects
 * @param pos1 The first position object
 * @param pos2 The second position object
 * @param useManhattanDistance Whether to use Manhattan distance (default: true)
 * @returns The distance between the two positions, or Infinity if they are on different maps
 */
export function getDistanceBetweenPositions(
  pos1: { mapId: string; position: IPosition },
  pos2: { mapId: string; position: IPosition },
  useManhattanDistance: boolean = true
): number {
  // If positions are on different maps, return infinity
  if (pos1.mapId !== pos2.mapId) {
    return Infinity;
  }

  // Create Position instances for proper distance calculation
  const pos1Instance = new Position(
    pos1.position.x,
    pos1.position.y,
    pos1.position.z
  );
  const pos2Instance = new Position(
    pos2.position.x,
    pos2.position.y,
    pos2.position.z
  );

  return useManhattanDistance
    ? pos1Instance.manhattanDistanceTo(pos2Instance)
    : pos1Instance.distanceTo(pos2Instance);
}

/**
 * Check if two position objects are adjacent to each other
 * @param pos1 The first position object
 * @param pos2 The second position object
 * @param allowDiagonal Whether to consider diagonal positions as adjacent (default: true)
 * @returns True if the positions are adjacent, false otherwise
 */
export function arePositionsAdjacent(
  pos1: { mapId: string; position: IPosition },
  pos2: { mapId: string; position: IPosition },
  allowDiagonal: boolean = true
): boolean {
  // If positions are on different maps, they can't be adjacent
  if (pos1.mapId !== pos2.mapId) {
    return false;
  }

  // Calculate the absolute differences
  const dx = Math.abs(pos1.position.x - pos2.position.x);
  const dy = Math.abs(pos1.position.y - pos2.position.y);

  if (allowDiagonal) {
    // With diagonals allowed, positions are adjacent if they're within Manhattan distance 1
    // This means either dx=1,dy=0 or dx=0,dy=1 or dx=1,dy=1 (diagonal)
    return (
      (dx === 1 && dy === 0) || (dx === 0 && dy === 1) || (dx === 1 && dy === 1)
    );
  } else {
    // Without diagonals, positions are adjacent only if Manhattan distance is 1 and on same axis
    // This means either dx=1,dy=0 or dx=0,dy=1, but not dx=1,dy=1
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
}

/**
 * Get all adjacent positions to a given position on a map
 * @param world The world containing the maps
 * @param mapId The ID of the map
 * @param x The x coordinate
 * @param y The y coordinate
 * @param allowDiagonal Whether to include diagonal positions (default: true)
 * @returns Array of positions adjacent to the given position
 */
export function getAdjacentPositions(
  world: World,
  mapId: string,
  x: number,
  y: number,
  allowDiagonal: boolean = true
): Position[] {
  try {
    const map = world.getMap(mapId);

    // Define the directions - if allowDiagonal is false, only use cardinal directions
    const directions = allowDiagonal
      ? [
          { dx: -1, dy: 0 }, // left
          { dx: 1, dy: 0 }, // right
          { dx: 0, dy: -1 }, // up
          { dx: 0, dy: 1 }, // down
          { dx: -1, dy: -1 }, // up-left
          { dx: -1, dy: 1 }, // down-left
          { dx: 1, dy: -1 }, // up-right
          { dx: 1, dy: 1 }, // down-right
        ]
      : [
          { dx: -1, dy: 0 }, // left
          { dx: 1, dy: 0 }, // right
          { dx: 0, dy: -1 }, // up
          { dx: 0, dy: 1 }, // down
        ];

    const adjacentPositions: Position[] = [];

    for (const { dx, dy } of directions) {
      const newX = x + dx;
      const newY = y + dy;

      // Check if the position is within map bounds
      if (newX >= 0 && newX < map.width && newY >= 0 && newY < map.height) {
        adjacentPositions.push(new Position(newX, newY));
      }
    }

    return adjacentPositions;
  } catch {
    return []; // Return empty array if map doesn't exist
  }
}

/**
 * Check if a position is valid (within map bounds)
 * @param world The world containing the maps
 * @param mapId The ID of the map
 * @param x The x coordinate
 * @param y The y coordinate
 * @returns True if the position is valid, false otherwise
 */
export function isValidPosition(
  world: World,
  mapId: string,
  x: number,
  y: number
): boolean {
  try {
    const map = world.getMap(mapId);
    return x >= 0 && x < map.width && y >= 0 && y < map.height;
  } catch {
    return false; // Return false if map doesn't exist
  }
}

/**
 * Get all position objects adjacent to a specific reference position
 * @param positions Array of position objects to search through
 * @param world The world containing the maps
 * @param referencePosition The reference position
 * @param allowDiagonal Whether to consider diagonal positions as adjacent (default: true)
 * @returns Array of adjacent position objects
 */
export function getAdjacentPositionsToPosition<T extends IUnitPosition>(
  positions: T[],
  world: World,
  referencePosition: IUnitPosition,
  allowDiagonal: boolean = true
): T[] {
  // Get adjacent positions
  const adjacentPositions = getAdjacentPositions(
    world,
    referencePosition.mapId,
    referencePosition.position.x,
    referencePosition.position.y,
    allowDiagonal
  );

  // Find positions at adjacent coordinates
  const adjacentPositionObjects: T[] = [];
  for (const adjPos of adjacentPositions) {
    const positionAtPos = getPositionAtCoordinate(
      positions,
      referencePosition.mapId,
      adjPos.x,
      adjPos.y
    );
    if (positionAtPos && positionAtPos.unitId !== referencePosition.unitId) {
      adjacentPositionObjects.push(positionAtPos);
    }
  }

  return adjacentPositionObjects;
}
