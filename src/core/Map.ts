import type { IMap, IMapCell, TerrainType, ITerrainProperties, IMapConfig } from '../types/mapTypes';
import { Position } from './Position';

/**
 * Map class represents a coordinate-based game map with terrain types
 */
export class Map implements IMap {
  width: number;
  height: number;
  name: string;
  cells: IMapCell[][];
  config: IMapConfig;

  constructor(width: number, height: number, name: string = 'Unnamed Map', config?: IMapConfig) {
    this.width = width;
    this.height = height;
    this.name = name;
    this.config = {
      wrapEdges: false,
      defaultTerrain: 'grass',
      defaultMovementCost: 1.0,
      ...config
    };
    
    // Initialize the map grid
    this.cells = this.initializeCells();
  }

  /**
   * Initialize the map cells with default terrain
   */
  private initializeCells(): IMapCell[][] {
    const cells: IMapCell[][] = [];
    
    for (let y = 0; y < this.height; y++) {
      const row: IMapCell[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(this.createDefaultCell());
      }
      cells.push(row);
    }
    
    return cells;
  }

  /**
   * Create a default cell with default terrain properties
   */
  private createDefaultCell(): IMapCell {
    return {
      terrain: this.config.defaultTerrain || 'grass',
      properties: {
        movementCost: this.config.defaultMovementCost || 1.0
      }
    };
  }

  /**
   * Check if coordinates are within map bounds
   */
  private isValidCoordinate(x: number, y: number): boolean {
    if (this.config.wrapEdges) {
      return true; // With wrapping, coordinates are always valid
    }
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get a wrapped coordinate if edges are wrapped
   */
  private getWrappedCoordinate(coord: number, max: number): number {
    if (this.config.wrapEdges) {
      // Wrap around the edges
      return ((coord % max) + max) % max;
    }
    return coord;
  }

  /**
   * Get the cell at the specified coordinates
   */
  getCell(x: number, y: number): IMapCell | null {
    if (!this.isValidCoordinate(x, y)) {
      return null;
    }

    // Get wrapped coordinates if necessary
    const wrappedX = this.getWrappedCoordinate(x, this.width);
    const wrappedY = this.getWrappedCoordinate(y, this.height);

    return this.cells[wrappedY]?.[wrappedX] || null;
  }

  /**
   * Get the terrain at the specified coordinates
   */
  getTerrain(x: number, y: number): TerrainType | null {
    const cell = this.getCell(x, y);
    return cell ? cell.terrain : null;
  }

  /**
   * Set the terrain at the specified coordinates
   */
  setTerrain(x: number, y: number, terrain: TerrainType, properties?: Partial<ITerrainProperties>): boolean {
    if (!this.isValidCoordinate(x, y)) {
      return false;
    }

    const wrappedX = this.getWrappedCoordinate(x, this.width);
    const wrappedY = this.getWrappedCoordinate(y, this.height);

    // Get default properties for the terrain type
    const terrainProps = this.getDefaultTerrainProperties(terrain);
    
    // Apply custom properties
    if (properties) {
      Object.assign(terrainProps, properties);
    }

    if (this.cells[wrappedY] && this.cells[wrappedY][wrappedX]) {
      this.cells[wrappedY][wrappedX] = {
        ...this.cells[wrappedY][wrappedX],
        terrain,
        properties: terrainProps
      };
    } else {
      // This shouldn't happen if coordinates are valid, but for type safety
      return false;
    }

    return true;
  }

  /**
   * Get default terrain properties based on terrain type
   */
  getDefaultTerrainProperties(terrainType: TerrainType): ITerrainProperties {
    // Default properties for common terrain types
    const defaults: Record<TerrainType, ITerrainProperties> = {
      grass: { movementCost: 1.0 },
      water: { movementCost: 2.0, movementBlocked: true }, // Units can't move through water
      mountain: { movementCost: 3.0 },
      forest: { movementCost: 1.5, visibilityModifier: 0.7 },
      desert: { movementCost: 1.2 },
      road: { movementCost: 0.8 },
      plains: { movementCost: 1.0 },
      swamp: { movementCost: 2.5 },
      snow: { movementCost: 1.3 },
      sand: { movementCost: 1.4 },
    };

    // Start with basic defaults
    const basicDefaults: ITerrainProperties = {
      movementCost: 1.0
    };

    // Get specific terrain defaults, or fall back to grass
    const terrainDefaults = defaults[terrainType] || defaults['grass'];

    // Return merged properties: basic -> grass fallback -> specific terrain
    return {
      ...basicDefaults,
      ...terrainDefaults
    };
  }

  /**
   * Check if a position is walkable (no units blocking and not blocked terrain)
   */
  isWalkable(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    if (!cell) return false;

    // Check if terrain blocks movement
    if (cell.properties.movementBlocked) return false;

    // Check if unit is occupying the space
    if (cell.occupiedBy) return false;

    return true;
  }

  /**
   * Check if a unit can occupy a specific position
   */
  canPlaceUnitAt(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    if (!cell) return false;

    // Check if terrain blocks placement
    if (cell.properties.movementBlocked) return false;

    // Check if position is already occupied
    if (cell.occupiedBy) return false;

    return true;
  }

  /**
   * Place a unit at the specified coordinates
   */
  placeUnit(unitId: string, x: number, y: number): boolean {
    if (!this.canPlaceUnitAt(x, y)) {
      return false;
    }

    const wrappedX = this.getWrappedCoordinate(x, this.width);
    const wrappedY = this.getWrappedCoordinate(y, this.height);

    const cell = this.cells[wrappedY]?.[wrappedX];
    if (!cell) {
      return false; // This shouldn't happen if canPlaceUnitAt passed
    }

    cell.occupiedBy = unitId;
    return true;
  }

  /**
   * Remove a unit from the specified coordinates
   */
  removeUnit(x: number, y: number): boolean {
    const cell = this.getCell(x, y);
    if (!cell) return false;

    delete cell.occupiedBy; // or set to undefined if the property exists
    return true;
  }

  /**
   * Get the unit ID at the specified coordinates
   */
  getUnitAt(x: number, y: number): string | undefined {
    const cell = this.getCell(x, y);
    if (!cell) return undefined;

    return cell.occupiedBy;
  }

  /**
   * Get all units on the map with their positions
   */
  getAllUnits(): Array<{ id: string; position: Position }> {
    const units: Array<{ id: string; position: Position }> = [];

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.cells[y]?.[x];
        if (cell && cell.occupiedBy) {
          units.push({
            id: cell.occupiedBy,
            position: new Position(x, y)
          });
        }
      }
    }

    return units;
  }

  /**
   * Get nearby cells within a specified range
   */
  getNearbyCells(x: number, y: number, range: number, includeDiagonals: boolean = true): Array<{ x: number; y: number; cell: IMapCell }> {
    const cells: Array<{ x: number; y: number; cell: IMapCell }> = [];

    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        // Skip the center position (0,0)
        if (dx === 0 && dy === 0) continue;

        // If diagonals are not allowed, skip diagonal moves
        if (!includeDiagonals && Math.abs(dx) === Math.abs(dy)) continue;

        const nx = x + dx;
        const ny = y + dy;

        const cell = this.getCell(nx, ny);
        if (cell) {
          cells.push({ x: nx, y: ny, cell });
        }
      }
    }

    return cells;
  }

  /**
   * Get a subregion of the map
   */
  getRegion(topLeftX: number, topLeftY: number, width: number, height: number): IMapCell[][] {
    const region: IMapCell[][] = [];
    
    for (let y = 0; y < height; y++) {
      const row: IMapCell[] = [];
      for (let x = 0; x < width; x++) {
        const cellX = topLeftX + x;
        const cellY = topLeftY + y;
        
        const cell = this.getCell(cellX, cellY);
        row.push(cell ? { ...cell } : this.createDefaultCell());
      }
      region.push(row);
    }
    
    return region;
  }

  /**
   * Resize the map
   */
  resize(newWidth: number, newHeight: number): void {
    if (newWidth <= 0 || newHeight <= 0) {
      throw new Error('Map dimensions must be positive');
    }

    // Create a new grid with the requested size
    const newCells: IMapCell[][] = [];
    
    for (let y = 0; y < newHeight; y++) {
      const row: IMapCell[] = [];
      for (let x = 0; x < newWidth; x++) {
        if (x < this.width && y < this.height) {
          // Copy existing cell
          const cell = this.cells[y]?.[x];
          if (cell) {
            row.push(cell);
          } else {
            // Create new cell with default properties
            row.push(this.createDefaultCell());
          }
        } else {
          // Create new cell with default properties
          row.push(this.createDefaultCell());
        }
      }
      newCells.push(row);
    }
    
    this.width = newWidth;
    this.height = newHeight;
    this.cells = newCells;
  }

  /**
   * Create a clone of the map
   */
  clone(name?: string): Map {
    const newMap = new Map(this.width, this.height, name || this.name, this.config);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Create a deep copy of the cell to ensure all properties including occupiedBy are copied
        const originalCell = this.cells[y]?.[x];
        if (originalCell) {
          // Create the new cell object dynamically to properly handle optional properties
          const baseCell = {
            terrain: originalCell.terrain,
            properties: { ...originalCell.properties }
          };

          // Only add occupiedBy property if it exists in the original (not undefined)
          const newCell = originalCell.occupiedBy !== undefined
            ? { ...baseCell, occupiedBy: originalCell.occupiedBy }
            : { ...baseCell };

          (newMap.cells[y] as IMapCell[])[x] = newCell as IMapCell;
        } else {
          (newMap.cells[y] as IMapCell[])[x] = this.createDefaultCell();
        }
      }
    }

    return newMap;
  }

  /**
   * Get the terrain properties at the specified coordinates
   */
  getTerrainProperties(x: number, y: number): ITerrainProperties | null {
    const cell = this.getCell(x, y);
    return cell ? cell.properties : null;
  }

  /**
   * Get the movement cost for the terrain at the specified coordinates
   */
  getMovementCost(x: number, y: number): number {
    const props = this.getTerrainProperties(x, y);
    return props ? props.movementCost || 1.0 : Infinity; // Return infinity if no valid cell
  }
}