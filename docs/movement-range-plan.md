# Movement Range And Pathing Plan

Goal: Units move multiple tiles per turn based on a movement range while Choukai owns all movement and path calculations. Takao only sequences state updates and emits render signals to Maya.

## Scope And Ownership
- Choukai: pathfinding, range capping, obstacle checks (terrain, walls, occupied tiles), and gate traversal logic.
- Takao: gathers world state (units, gates), requests paths from Choukai, applies each step to unit state, and triggers Maya renders on demand.
- Maya: renders updated state only, no movement logic.

## Decisions Needed Before Implementation
- Movement range meaning: step count vs movement cost budget.
- Diagonal movement: allowed or cardinal only.
- Gate traversal: consume one step on entry, or teleport without spending extra.
- Default movement range: config value vs unit property value.

## Work Plan (Progress Checklist)
- [x] Define movement range source in Takao (use unit property `movementRange`; if missing, treat as 0 so the unit cannot move).
- [x] Add Choukai movement planning types and pure functions for path steps from point A to point B.
- [x] Ensure Choukai pathing respects impassable terrain, walls, occupied tiles, and gate transitions.
- [x] Add Choukai tests for multi-step pathing, gates, and no-path errors.
- [x] Update Takao StoryTeller movement planning to request full paths from Choukai.
- [ ] Add WorldManager helper to apply a movement path step-by-step.
- [ ] Trigger Maya render after each step when a unit moves multiple tiles.
- [ ] Update Takao docs and examples to include movement range behavior.
- [ ] Add Takao tests for multi-step movement and collision avoidance.

## Progress Notes
- Initial plan written.
- Choukai path planning and tests added; StoryTeller now delegates movement planning to WorldManager.
