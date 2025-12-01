import { Map as GameMap } from './Map';

/**
 * World class manages multiple maps
 */
export class World {
  private maps: GameMap[] = [];

  constructor() {
    // Initialize the world
  }

  /**
   * Add a map to the world
   */
  addMap(map: GameMap): boolean {
    // Check if a map with this name already exists
    if (this.maps.some(m => m.name === map.name)) {
      return false;
    }

    this.maps.push(map);
    return true;
  }

  /**
   * Get a map by name
   */
  getMap(name: string): GameMap {
    const map = this.maps.find(map => map.name === name);
    if (!map) {
      throw new Error(`Map with name ${name} does not exist in the world`);
    }
    return map;
  }

  /**
   * Remove a map by name
   */
  removeMap(name: string): boolean {
    const index = this.maps.findIndex(map => map.name === name);
    if (index === -1) {
      return false;
    }

    this.maps.splice(index, 1);
    return true;
  }

  /**
   * Get all maps in the world
   */
  getAllMaps(): GameMap[] {
    return [...this.maps];
  }

  /**
   * Clear the world of all maps
   */
  clear(): void {
    this.maps = [];
  }
}
