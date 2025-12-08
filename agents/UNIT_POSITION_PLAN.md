# Unit Position System Plan

Moving unit position functionality from Takao's utils to pure functions in the Choukai map and positioning system. This refactoring will centralize position-related operations in the appropriate module and eliminate the TypeScript error in UnitPosition.ts.

## Module layout
- New file: `Choukai/src/utils/unitPositions.ts` - contains pure position utility functions
- Functions operate on generic position data to maintain Choukai's independence from the unit system
- Takao will adapt its unit data to work with these generic position operations

## Pure functions to implement in Choukai
1. `stepTowards(world: World, mapId: string, from: IPosition, to: IPosition): Position`
   - Compute a single-tile step from one position toward another, clamped to map bounds

2. `getPositionsAtCoordinate(positions: Array<{mapId: string, position: IPosition, id: string}>, mapId: string, x: number, y: number): Array<{mapId: string, position: IPosition, id: string}>`
   - Get all positions at a specific map coordinate

3. `findCollisions(positions: Array<{mapId: string, position: IPosition, id: string}>): Array<{mapId: string; x: number; y: number; positions: Array<{mapId: string, position: IPosition, id: string}>}>`
   - Find any positions that have more than one position object at the same coordinate

4. `getPositionAtCoordinate(positions: Array<{mapId: string, position: IPosition, id: string}>, mapId: string, x: number, y: number): {mapId: string, position: IPosition, id: string} | undefined`
   - Find the position object at a specific coordinate

5. `getPositionsInMap(positions: Array<{mapId: string, position: IPosition, id: string}>, mapId: string): Array<{mapId: string, position: IPosition, id: string}>`
   - Get all positions on a specific map

6. `getPositionsWithinRange(positions: Array<{mapId: string, position: IPosition, id: string}>, world: World, referencePosition: {mapId: string, position: IPosition, id: string}, range: number, useManhattanDistance?: boolean): Array<{mapId: string, position: IPosition, id: string}>`
   - Get all positions within a specific range of a reference position

7. `getDistanceBetweenPositions(pos1: {mapId: string, position: IPosition}, pos2: {mapId: string, position: IPosition}, useManhattanDistance?: boolean): number`
   - Calculate the distance between two position objects

8. `arePositionsAdjacent(pos1: {mapId: string, position: IPosition}, pos2: {mapId: string, position: IPosition}, allowDiagonal?: boolean): boolean`
   - Check if two position objects are adjacent to each other

9. `getAdjacentPositions(world: World, mapId: string, x: number, y: number, allowDiagonal?: boolean): Position[]`
   - Get all adjacent positions to a given position on a map

10. `isValidPosition(world: World, mapId: string, x: number, y: number): boolean`
    - Check if a position is valid (within map bounds)

11. `getAdjacentPositionsToPosition(positions: Array<{mapId: string, position: IPosition, id: string}>, world: World, referencePosition: {mapId: string, position: IPosition, id: string}, allowDiagonal?: boolean): Array<{mapId: string, position: IPosition, id: string}>`
    - Get all position objects adjacent to a specific reference position

## Refactoring Takao's UnitPosition class
- Replace the static methods in `Takao/src/utils/UnitPosition.ts` with calls to the new Choukai pure functions
- Create adapter functions in Takao that convert between unit position data and the generic position data structures used by Choukai
- Ensure all functionality remains equivalent after refactoring

## Per-call flow in Takao (after refactoring)
1) Extract unit position data and convert to the generic format expected by Choukai functions
2) Call the appropriate Choukai pure function with the converted data
3) Convert the result back to the expected unit-based format
4) Return the result to the original caller

## Integration points
- In Takao's unit position operations, replace direct implementation with calls to Choukai's pure functions
- Maintain backward compatibility by keeping the same function signatures in Takao but changing the internal implementation
- Update tests to verify the refactored code works as expected

## Testing
- Unit tests for each new pure function in Choukai
- E2E tests to ensure the refactored code in Takao works as expected
- Verify no functionality is lost during the refactoring
- Test edge cases like invalid positions, units on different maps, etc.

## Benefits of this refactoring
- Centralizes position operations in the appropriate Choukai module
- Eliminates the TypeScript error in UnitPosition.ts
- Makes the codebase more maintainable by following the separation of concerns principle
- Enables better testability of position-related operations
- Provides a cleaner architecture by keeping map/position logic in Choukai and unit logic in Atago/Takao

## Implementation snapshot (planned)
- Create `Choukai/src/utils/unitPositions.ts` with all the required pure functions
- Update `Takao/src/utils/UnitPosition.ts` to delegate to the new Choukai functions
- Verify all tests still pass after refactoring
- Update any dependent code that was using the UnitPosition class directly