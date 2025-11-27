import type { IMap, IPosition } from '../types/positionTypes';

/**
 * Position class represents a coordinate in 2D or 3D space
 */
export class Position implements IPosition {
  x: number;
  y: number;
  z?: number;

  constructor(x: number, y: number, z?: number) {
    this.x = x;
    this.y = y;
    if (z !== undefined) {
      this.z = z;
    }
  }

  /**
   * Calculate the distance to another position
   */
  distanceTo(other: IPosition): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    let dz = 0;
    if (this.z !== undefined && other.z !== undefined) {
      dz = this.z - other.z;
    }

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate Manhattan distance to another position
   */
  manhattanDistanceTo(other: IPosition): number {
    const dx = Math.abs(this.x - other.x);
    const dy = Math.abs(this.y - other.y);
    let dz = 0;
    if (this.z !== undefined && other.z !== undefined) {
      dz = Math.abs(this.z - other.z);
    }

    return dx + dy + dz;
  }

  /**
   * Check if this position is adjacent to another position
   */
  isAdjacentTo(other: IPosition, allowDiagonal: boolean = true): boolean {
    const dx = Math.abs(this.x - other.x);
    const dy = Math.abs(this.y - other.y);

    if (allowDiagonal) {
      // Adjacent includes diagonal positions
      return dx <= 1 && dy <= 1 && dx + dy > 0;
    } else {
      // Only horizontal/vertical adjacency
      return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
  }

  /**
   * Checks if a position is within map bounds
   * @param position - Position to check
   * @param map - Map to check against
   * @returns True if position is within bounds
   */
  isPositionInBounds(position: Position, map: IMap): boolean {
    return (
      position.x >= 0 &&
      position.x < map.width &&
      position.y >= 0 &&
      position.y < map.height
    );
  }

  /**
   * Gets all positions adjacent to the given position within map bounds
   * @param position - Center position
   * @param map - Map to check bounds against
   * @returns Array of adjacent positions
   */
  getAdjacentPositions(position: Position, map: IMap): Position[] {
    const directions = [
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ];

    return directions
      .map(
        dir => ({ x: position.x + dir.x, y: position.y + dir.y }) as Position
      )
      .filter(pos => this.isPositionInBounds(pos, map));
  }

  /**
   * Checks if two positions are equal
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns True if positions are equal
   */
  positionsEqual(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }

  /**
   * Clone this position
   */
  clone(): Position {
    return new Position(this.x, this.y, this.z);
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    if (this.z !== undefined) {
      return `(${this.x}, ${this.y}, ${this.z})`;
    }
    return `(${this.x}, ${this.y})`;
  }

  /**
   * Create position from string representation
   */
  static fromString(positionStr: string): Position {
    const coords = positionStr
      .replace(/[()]/g, '')
      .split(',')
      .map(coord => parseFloat(coord.trim()));

    if (coords.length === 2) {
      return new Position(coords[0]!, coords[1]!);
    } else if (coords.length === 3) {
      return new Position(coords[0]!, coords[1]!, coords[2]!);
    } else {
      throw new Error(`Invalid position string: ${positionStr}`);
    }
  }

  /**
   * Check if two positions are equal
   */
  equals(other: IPosition): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  /**
   * Calculate the position in a given direction
   */
  offset(dx: number, dy: number, dz: number = 0): Position {
    const newZ = this.z !== undefined ? this.z + dz : undefined;
    if (newZ !== undefined) {
      return new Position(this.x + dx, this.y + dy, newZ);
    } else {
      return new Position(this.x + dx, this.y + dy);
    }
  }

  /**
   * Get normalized direction vector to another position
   */
  directionTo(other: IPosition): { x: number; y: number; z?: number } {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dzValue =
      this.z !== undefined && other.z !== undefined
        ? other.z - this.z
        : undefined;

    const magnitude = Math.sqrt(
      dx * dx + dy * dy + (dzValue !== undefined ? dzValue * dzValue : 0)
    );

    if (magnitude === 0) {
      if (dzValue !== undefined) {
        return { x: 0, y: 0, z: dzValue };
      } else {
        return { x: 0, y: 0 };
      }
    }

    const result = {
      x: dx / magnitude,
      y: dy / magnitude,
    };

    if (dzValue !== undefined) {
      (result as any).z = dzValue / magnitude;
    }

    return result as { x: number; y: number; z?: number };
  }
}
