/**
 * Example: Integration with Atago Units
 *
 * This example demonstrates how Choukai maps can work with Atago units
 * to provide spatial awareness and terrain-based effects.
 */

import { Map, World } from '../src';

// For this example, we'll simulate Atago units since we don't have the actual import
// In a real scenario, you would import from '@atsu/atago'
interface IUnit {
  id: string;
  name: string;
  properties: Record<string, any>;
  setProperty(name: string, value: any): void;
  getPropertyValue<T>(name: string): T | undefined;
}

class MockAtagoUnit implements IUnit {
  id: string;
  name: string;
  properties: Record<string, any> = {};

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  setProperty(name: string, value: any): void {
    this.properties[name] = value;
  }

  getPropertyValue<T>(name: string): T | undefined {
    return this.properties[name] as T | undefined;
  }
}

console.log('=== Choukai Example: Integration with Atago Units ===\n');

// Create a game map
const gameMap = new Map(20, 20, 'Strategy Field');

// Set up terrain that affects units differently
gameMap.setTerrain(5, 5, 'water', { movementCost: 2.5, defenseBonus: -1 });
gameMap.setTerrain(10, 10, 'mountain', { movementCost: 4.0, defenseBonus: 2 });
gameMap.setTerrain(15, 15, 'forest', { movementCost: 1.5, defenseBonus: 1, visibilityModifier: 0.7 });

// Create mock Atago units
const playerUnit = new MockAtagoUnit('player-1', 'Hero');
playerUnit.setProperty('health', 100);
playerUnit.setProperty('attack', 20);
playerUnit.setProperty('defense', 10);
playerUnit.setProperty('speed', 5);

const enemyUnit = new MockAtagoUnit('enemy-1', 'Orc');
enemyUnit.setProperty('health', 80);
enemyUnit.setProperty('attack', 25);
enemyUnit.setProperty('defense', 8);
enemyUnit.setProperty('speed', 3);

console.log(`Created units:`);
console.log(`- ${playerUnit.name} (ID: ${playerUnit.id})`);
console.log(`- ${enemyUnit.name} (ID: ${enemyUnit.id})`);

// Create a world and add the map
const world = new World();
world.addMap(gameMap);

// Place units in the world
world.setUnitPosition(playerUnit.id, 'Strategy Field', { x: 5, y: 4 }); // Near water
world.setUnitPosition(enemyUnit.id, 'Strategy Field', { x: 9, y: 10 }); // Near mountain

console.log(`\nUnits placed in the world:`);
const allUnits = world.getAllUnits();
allUnits.forEach(unit => {
  console.log(`- ${unit.unitId} at position ${unit.position.toString()}`);
});

// Function to apply terrain effects to a unit
function applyTerrainEffects(unit: IUnit, world: World, mapName: string) {
  const pos = world.getUnitPosition(unit.id);
  if (!pos || pos.mapId !== mapName) return;

  const map = world.getMap(mapName);
  if (!map) return;

  const terrainProps = map.getTerrainProperties(pos.position.x, pos.position.y);
  if (!terrainProps) return;

  // Apply defense bonus if present
  if (terrainProps.defenseBonus !== undefined) {
    const currentDefense = unit.getPropertyValue<number>('defense') || 0;
    const newDefense = currentDefense + terrainProps.defenseBonus;
    unit.setProperty('defense', newDefense);
    console.log(`Applied terrain defense bonus to ${unit.id}. New defense: ${newDefense}`);
  }

  // Store movement cost for reference
  const movementCost = map.getMovementCost(pos.position.x, pos.position.y);
  unit.setProperty('currentTerrainCost', movementCost);
  console.log(`${unit.id} terrain movement cost: ${movementCost}`);
}

console.log(`\nApplying terrain effects:`);
applyTerrainEffects(playerUnit, world, 'Strategy Field');
applyTerrainEffects(enemyUnit, world, 'Strategy Field');

// Show unit properties after terrain effects
console.log(`\nFinal unit properties:`);
console.log(`${playerUnit.name} defense: ${playerUnit.getPropertyValue('defense')}`);
console.log(`${playerUnit.name} terrain cost: ${playerUnit.getPropertyValue('currentTerrainCost')}`);

console.log(`${enemyUnit.name} defense: ${enemyUnit.getPropertyValue('defense')}`);
console.log(`${enemyUnit.name} terrain cost: ${enemyUnit.getPropertyValue('currentTerrainCost')}`);

// Move units and see how terrain affects them
console.log(`\nMoving player toward the water terrain...`);
world.moveUnit(playerUnit.id, 5, 5); // Into water terrain
applyTerrainEffects(playerUnit, world, 'Strategy Field');
console.log(`${playerUnit.name} now in water. Defense: ${playerUnit.getPropertyValue('defense')}, Cost: ${playerUnit.getPropertyValue('currentTerrainCost')}`);

console.log(`\nMoving enemy toward the mountain terrain...`);
world.moveUnit(enemyUnit.id, 10, 10); // Into mountain terrain
applyTerrainEffects(enemyUnit, world, 'Strategy Field');
console.log(`${enemyUnit.name} now in mountain. Defense: ${enemyUnit.getPropertyValue('defense')}, Cost: ${enemyUnit.getPropertyValue('currentTerrainCost')}`);

console.log('\nIntegration with Atago Units example completed!');