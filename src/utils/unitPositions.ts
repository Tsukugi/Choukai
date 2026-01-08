import type { IMapPosition, IPosition } from '../types/positionTypes';
import { Position } from '../core/Position';
import { World } from '../core/World';
import type { IUnitPosition } from '@atsu/atago';
import type {
  GateConnection,
  MovementPlanOptions,
  MovementPlanResult,
} from '../types/mapTypes';

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
 * Find the nearest free tile to the origin that is not occupied.
 */
export function findNearestFreeTile(
  world: World,
  mapId: string,
  occupiedPositions: IUnitPosition[],
  origin: IPosition,
  maxRadius: number = 5
): { x: number; y: number } | null {
  const map = world.getMap(mapId);
  if (!map) return null;

  const occupied = new Set(
    occupiedPositions
      .filter(pos => pos.mapId === mapId)
      .map(pos => `${pos.position.x},${pos.position.y}`)
  );

  for (let radius = 0; radius <= maxRadius; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;
        const nx = origin.x + dx;
        const ny = origin.y + dy;
        if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
        if (!occupied.has(`${nx},${ny}`)) {
          return { x: nx, y: ny };
        }
      }
    }
  }

  return null;
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

type MapPositionKey = string;

// Use a stable string key because Map/Set don't provide value equality for objects.
const createMapPosition = (
  mapId: string,
  x: number,
  y: number
): IMapPosition => ({
  mapId,
  position: new Position(x, y),
});

export const getMapPositionKey = (position: IMapPosition): MapPositionKey =>
  `${position.mapId}:${position.position.x},${position.position.y}`;

const buildOccupiedPositionSet = (
  positions: IMapPosition[],
  start: IMapPosition
): Set<MapPositionKey> => {
  const occupied = new Set<MapPositionKey>();

  for (const pos of positions) {
    const matchesStart =
      pos.mapId === start.mapId &&
      pos.position.x === start.position.x &&
      pos.position.y === start.position.y;

    if (matchesStart) {
      continue;
    }

    occupied.add(getMapPositionKey(pos));
  }

  return occupied;
};

const buildGateIndex = (
  gateConnections: GateConnection[]
): Map<string, Map<string, GateConnection>> => {
  const index = new Map<string, Map<string, GateConnection>>();

  for (const gate of gateConnections) {
    const gateKey = `${gate.positionFrom.x},${gate.positionFrom.y}`;
    const mapEntry = index.get(gate.mapFrom) ?? new Map<string, GateConnection>();

    if (mapEntry.has(gateKey)) {
      throw new Error(
        `Multiple gates share entry ${gate.mapFrom} (${gate.positionFrom.x}, ${gate.positionFrom.y})`
      );
    }

    mapEntry.set(gateKey, gate);
    index.set(gate.mapFrom, mapEntry);
  }

  return index;
};

const getDistance = (
  dx: number,
  dy: number,
  useManhattan: boolean
): number => {
  if (useManhattan) {
    return Math.abs(dx) + Math.abs(dy);
  }
  return Math.max(Math.abs(dx), Math.abs(dy));
};

const getGoalPositions = (
  world: World,
  target: IMapPosition,
  range: number,
  occupied: Set<MapPositionKey>,
  useManhattan: boolean
): IMapPosition[] => {
  const map = world.getMap(target.mapId);
  const positions: IMapPosition[] = [];

  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const distance = getDistance(dx, dy, useManhattan);
      if (distance > range) {
        continue;
      }

      const x = target.position.x + dx;
      const y = target.position.y + dy;

      if (!map.isWalkable(x, y)) {
        continue;
      }

      const candidate = createMapPosition(target.mapId, x, y);
      if (occupied.has(getMapPositionKey(candidate))) {
        continue;
      }

      positions.push(candidate);
    }
  }

  return positions;
};

/**
 * Plan a movement path toward a target, respecting terrain, occupied tiles, and gates.
 */
export function planMovementSteps(
  world: World,
  start: IMapPosition,
  target: IMapPosition,
  movementRange: number,
  options: MovementPlanOptions = {}
): MovementPlanResult {
  if (!Number.isFinite(movementRange) || movementRange < 0) {
    throw new Error('Movement range must be a non-negative number');
  }

  if (options.stopWithinRange !== undefined && options.stopWithinRange < 0) {
    throw new Error('stopWithinRange must be a non-negative number');
  }

  const startMap = world.getMap(start.mapId);
  if (!startMap.isWalkable(start.position.x, start.position.y)) {
    throw new Error('Start position is not walkable');
  }

  const occupied = buildOccupiedPositionSet(
    options.occupiedPositions ?? [],
    start
  );
  const gateIndex = buildGateIndex(options.gateConnections ?? []);
  const allowDiagonal = options.allowDiagonal === true;
  const useManhattan = options.useManhattanDistance !== false;

  const directions = allowDiagonal
    ? [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: -1 },
        { dx: -1, dy: 1 },
        { dx: 1, dy: -1 },
        { dx: 1, dy: 1 },
      ]
    : [
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
      ];

  let goalPositions: IMapPosition[] = [];

  if (options.stopWithinRange !== undefined) {
    goalPositions = getGoalPositions(
      world,
      target,
      options.stopWithinRange,
      occupied,
      useManhattan
    );
    if (goalPositions.length === 0) {
      throw new Error('No available goal positions within target range');
    }
  } else {
    const targetMap = world.getMap(target.mapId);
    if (!targetMap.isWalkable(target.position.x, target.position.y)) {
      throw new Error('Target position is not walkable');
    }

    if (occupied.has(getMapPositionKey(target))) {
      throw new Error('Target position is occupied');
    }
    goalPositions = [target];
  }

  const startKey = getMapPositionKey(start);
  const goalKeys = new Set(
    goalPositions.map(goal => getMapPositionKey(goal))
  );
  const startIsGoal = goalKeys.has(startKey);

  if (movementRange === 0 || startIsGoal) {
    return {
      steps: [],
      finalPosition: {
        mapId: start.mapId,
        position: new Position(
          start.position.x,
          start.position.y,
          start.position.z
        ),
      },
      reachedGoal: startIsGoal,
    };
  }

  const queue: MapPositionKey[] = [startKey];
  let queueIndex = 0;
  const visited = new Set<MapPositionKey>([startKey]);
  const nodes = new Map<MapPositionKey, IMapPosition>([[startKey, start]]);
  const cameFrom = new Map<
    MapPositionKey,
    { prevKey: MapPositionKey; command: IMapPosition }
  >();
  let foundGoal: MapPositionKey | null = null;

  while (queueIndex < queue.length && !foundGoal) {
    const currentKey = queue[queueIndex];
    queueIndex += 1;

    if (!currentKey) {
      continue;
    }

    const currentPosition = nodes.get(currentKey);
    if (!currentPosition) {
      continue;
    }

    const currentMap = world.getMap(currentPosition.mapId);

    for (const { dx, dy } of directions) {
      const stepX = currentPosition.position.x + dx;
      const stepY = currentPosition.position.y + dy;

      if (!currentMap.isWalkable(stepX, stepY)) {
        continue;
      }

      const stepPosition = createMapPosition(
        currentPosition.mapId,
        stepX,
        stepY
      );
      if (occupied.has(getMapPositionKey(stepPosition))) {
        continue;
      }

      const gate = gateIndex
        .get(currentPosition.mapId)
        ?.get(`${stepX},${stepY}`);
      let nextPosition = stepPosition;

      if (gate) {
        const destMap = world.getMap(gate.mapTo);
        if (!destMap.isWalkable(gate.positionTo.x, gate.positionTo.y)) {
          continue;
        }

        const destPosition = createMapPosition(
          gate.mapTo,
          gate.positionTo.x,
          gate.positionTo.y
        );
        if (occupied.has(getMapPositionKey(destPosition))) {
          continue;
        }

        nextPosition = destPosition;
      }

      const nextKey = getMapPositionKey(nextPosition);
      if (visited.has(nextKey)) {
        continue;
      }

      visited.add(nextKey);
      nodes.set(nextKey, nextPosition);
      cameFrom.set(nextKey, {
        prevKey: currentKey,
        command: stepPosition,
      });

      if (goalKeys.has(nextKey)) {
        foundGoal = nextKey;
        break;
      }

      queue.push(nextKey);
    }
  }

  if (!foundGoal) {
    throw new Error('No path found to a reachable goal');
  }

  const commands: IMapPosition[] = [];
  const results: IMapPosition[] = [];
  let currentKey = foundGoal;

  while (currentKey !== startKey) {
    const link = cameFrom.get(currentKey);
    if (!link) {
      throw new Error('Failed to reconstruct movement path');
    }

    const resultPosition = nodes.get(currentKey);
    if (!resultPosition) {
      throw new Error('Failed to reconstruct movement path');
    }

    commands.push(link.command);
    results.push(resultPosition);
    currentKey = link.prevKey;
  }

  commands.reverse();
  results.reverse();

  const maxSteps = Math.min(movementRange, commands.length);
  const steps = commands.slice(0, maxSteps);
  const finalPosition =
    maxSteps > 0
      ? results[maxSteps - 1]!
      : {
          mapId: start.mapId,
          position: new Position(
            start.position.x,
            start.position.y,
            start.position.z
          ),
        };

  return {
    steps,
    finalPosition,
    reachedGoal: commands.length <= movementRange,
  };
}
