/**
 * Example: Basic Map Usage
 *
 * This example demonstrates the core functionality of creating and using
 * maps with the Choukai library for unit positioning and terrain management.
 */

import { Map, Position, World } from '../src';

console.log('=== Choukai Example: Basic Map Usage ===\n');

// Create a 10x10 map
const gameMap = new Map(10, 10, 'Battlefield');
console.log(
  `Created map: ${gameMap.name}, dimensions: ${gameMap.width}x${gameMap.height}`
);

// Set different terrains on the map
gameMap.setTerrain(5, 5, 'water');
gameMap.setTerrain(3, 3, 'mountain');
gameMap.setTerrain(7, 7, 'forest');

console.log(`Terrain at (5,5): ${gameMap.getTerrain(5, 5)}`); // water
console.log(`Terrain at (3,3): ${gameMap.getTerrain(3, 3)}`); // mountain
console.log(`Terrain at (7,7): ${gameMap.getTerrain(7, 7)}`); // forest

// Check movement costs for different terrains
console.log(`Movement cost at (5,5) (water): ${gameMap.getMovementCost(5, 5)}`); // 2.0
console.log(
  `Movement cost at (3,3) (mountain): ${gameMap.getMovementCost(3, 3)}`
); // 3.0
console.log(`Movement cost at (1,1) (grass): ${gameMap.getMovementCost(1, 1)}`); // 1.0

// Create a position
const pos = new Position(2, 2);
console.log(`\nCreated position: ${pos.toString()}`);

// Calculate distance between positions
const pos2 = new Position(5, 6);
const distance = pos.distanceTo(pos2);
console.log(
  `Distance from ${pos.toString()} to ${pos2.toString()}: ${distance}`
);

// Place units on the map
console.log('\nPlacing units on the map...');
const placed1 = gameMap.placeUnit('player-1', 2, 2);
const placed2 = gameMap.placeUnit('enemy-1', 8, 8);

console.log(`Player placed: ${placed1}`);
console.log(`Enemy placed: ${placed2}`);

// Check if positions are walkable
console.log(`Is (2,2) walkable? ${gameMap.isWalkable(2, 2)}`); // false, because of unit
console.log(`Is (1,1) walkable? ${gameMap.isWalkable(1, 1)}`); // true

// Check what units are on the map
const units = gameMap.getAllUnits();
console.log(`Units on map: ${units.length}`);
units.forEach(unit => {
  console.log(`- ${unit.unitId} at ${unit.position.toString()}`);
});

// Create a world to manage multiple maps
console.log('\n=== World Management ===');
const world = new World();

// Add the battlefield map to the world
world.addMap(gameMap);

// Create another map
const forestMap = new Map(15, 15, 'Forest');
world.addMap(forestMap);

console.log(`Maps in world: ${world.getAllMaps().length}`);

// Place units in the world
world.setUnitPosition('player-1', 'Battlefield', { x: 2, y: 2 });
world.setUnitPosition('enemy-1', 'Battlefield', { x: 8, y: 8 });
world.setUnitPosition('forest-creature', 'Forest', { x: 7, y: 7 });

console.log('\nUnits in world:');
const allUnits = world.getAllUnits();
allUnits.forEach(unit => {
  console.log(
    `- ${unit.unitId} on map '${unit.mapId}' at ${unit.position.toString()}`
  );
});

// Move a unit
world.moveUnit('player-1', 3, 2);
console.log(`\nAfter moving player-1 to (3,2):`);
const playerPos = world.getUnitPosition('player-1');
console.log(`Player position: ${playerPos?.position.toString()}`);

// Calculate distance between units (same map)
const distanceBetween = world.getDistanceBetweenUnits('player-1', 'enemy-1');
console.log(`Distance between player and enemy: ${distanceBetween}`);

console.log('\nBasic Map Usage example completed!');
