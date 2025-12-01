/**
 * Map and Position Types
 */

// Basic position coordinates
export interface IPosition {
  x: number;
  y: number;
  z?: number; // Optional z-coordinate for 3D positioning
}

// Terrain types that can affect units
export type TerrainType =
  | 'grass'
  | 'water'
  | 'mountain'
  | 'forest'
  | 'desert'
  | 'road'
  | 'plains'
  | 'swamp'
  | 'snow'
  | 'sand'
  | string; // Allow custom terrain types

// Terrain properties that can affect units
export interface ITerrainProperties {
  movementCost: number; // Multiplier for movement cost
  defenseBonus?: number; // Bonus to defense when on this terrain
  visibilityModifier?: number; // How much this terrain affects visibility
  impassable?: boolean; // By no means can units pass through this terrain
}

// Map cell definition
export interface IMapCell {
  terrain: TerrainType;
  properties: ITerrainProperties;
}

// Map data structure
export interface IMap {
  width: number;
  height: number;
  name: string;
  cells: IMapCell[][];
}

