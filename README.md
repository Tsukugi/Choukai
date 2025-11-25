# Choukai - Map and Positioning System

Choukai is a map and positioning system that allows units to be placed and managed within coordinate-based maps with different terrain types. It works alongside the Atago game unit system to provide spatial awareness and positioning for game units.

## Features

- Coordinate-based maps with customizable terrain types
- Unit positioning and movement on maps
- Terrain influence on unit properties and behavior
- Support for different map sizes and topologies
- Integration with Atago units for game logic

## Installation

```bash
npm install @atsu/choukai
```

## Usage

```typescript
import { Map, Position } from '@atsu/choukai';

// Create a 10x10 map with default terrain
const gameMap = new Map(10, 10);

// Set terrain at a specific position
gameMap.setTerrain(5, 5, 'grass');

// Position a unit on the map
const position = new Position(5, 5);
```

## Development

To build the project:

```bash
npm run build
```

To run tests:

```bash
npm run test
```

To run in development mode with watch:

```bash
npm run dev
```

## Architecture

Choukai provides a flexible system for managing game maps and unit positioning:

- `Map`: Represents a coordinate-based map with terrain types
- `Position`: Represents coordinates in the map space
- `World`: Manages multiple maps and unit positioning across them
- `TerrainType`: Defines different terrain properties that can affect units