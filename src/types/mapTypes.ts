/**
 * Map-specific Types
 */

export * from './positionTypes';

// Pathfinding options
export interface IPathfindingOptions {
  allowDiagonal?: boolean;
  heuristic?: 'manhattan' | 'euclidean' | 'chebyshev';
}

// Map event types
export type MapEventType =
  | 'unitMoved'
  | 'terrainChanged'
  | 'unitPlaced'
  | 'unitRemoved'
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
