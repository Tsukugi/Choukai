/**
 * Map-specific Types
 */

import type { IMapPosition, IPosition } from './positionTypes';

export * from './positionTypes';

// Pathfinding options
export interface IPathfindingOptions {
  allowDiagonal?: boolean;
  heuristic?: 'manhattan' | 'euclidean' | 'chebyshev';
}

export interface GateConnection {
  mapFrom: string;
  positionFrom: IPosition;
  mapTo: string;
  positionTo: IPosition;
  name?: string;
  bidirectional?: boolean;
}

export interface MovementPlanOptions extends IPathfindingOptions {
  stopWithinRange?: number;
  occupiedPositions?: IMapPosition[];
  gateConnections?: GateConnection[];
  useManhattanDistance?: boolean;
}

export interface MovementPlanResult {
  steps: IMapPosition[];
  finalPosition: IMapPosition;
  reachedGoal: boolean;
}

// Map event types
export type MapEventType =
  | 'terrainChanged'
  | 'mapChanged';

export interface IMapEvent {
  type: MapEventType;
  mapId: string;
  position: [number, number];
  data?: any;
}

// Map configuration
export interface IMapConfig {
  wrapEdges?: boolean; // Whether moving past edges wraps to the other side
  defaultTerrain?: string; // Default terrain type for new cells
  defaultMovementCost?: number; // Default movement cost for terrain
}
