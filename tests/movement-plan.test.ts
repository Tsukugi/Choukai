import { describe, it, expect, beforeEach } from 'vitest';
import { World } from '../src/core/World';
import { Map } from '../src/core/Map';
import { Position } from '../src/core/Position';
import { planMovementSteps } from '../src/utils/unitPositions';
import type { IMapPosition } from '../src/types/positionTypes';
import type { GateConnection } from '../src/types/mapTypes';

describe('planMovementSteps', () => {
  let world: World;
  let map: Map;

  beforeEach(() => {
    world = new World();
    map = new Map(5, 5, 'MapA');
    world.addMap(map);
  });

  it('plans around impassable terrain', () => {
    map.setTerrain(1, 0, 'water');

    const start: IMapPosition = {
      mapId: 'MapA',
      position: new Position(0, 0),
    };
    const target: IMapPosition = {
      mapId: 'MapA',
      position: new Position(2, 0),
    };

    const plan = planMovementSteps(world, start, target, 10);

    expect(plan.reachedGoal).toBe(true);
    expect(plan.finalPosition.mapId).toBe('MapA');
    expect(plan.finalPosition.position.x).toBe(2);
    expect(plan.finalPosition.position.y).toBe(0);
    expect(
      plan.steps.some(
        step => step.position.x === 1 && step.position.y === 0
      )
    ).toBe(false);
  });

  it('caps steps when range is shorter than the path', () => {
    const start: IMapPosition = {
      mapId: 'MapA',
      position: new Position(0, 0),
    };
    const target: IMapPosition = {
      mapId: 'MapA',
      position: new Position(3, 0),
    };

    const plan = planMovementSteps(world, start, target, 2);

    expect(plan.reachedGoal).toBe(false);
    expect(plan.steps).toHaveLength(2);
    expect(plan.finalPosition.position.x).toBe(2);
    expect(plan.finalPosition.position.y).toBe(0);
  });

  it('uses gates to reach another map', () => {
    const mapB = new Map(4, 4, 'MapB');
    world.addMap(mapB);

    const start: IMapPosition = {
      mapId: 'MapA',
      position: new Position(0, 0),
    };
    const target: IMapPosition = {
      mapId: 'MapB',
      position: new Position(2, 2),
    };

    const gates: GateConnection[] = [
      {
        mapFrom: 'MapA',
        positionFrom: { x: 1, y: 0 },
        mapTo: 'MapB',
        positionTo: { x: 2, y: 2 },
      },
    ];

    const plan = planMovementSteps(world, start, target, 1, {
      gateConnections: gates,
    });

    expect(plan.reachedGoal).toBe(true);
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.mapId).toBe('MapA');
    expect(plan.steps[0]?.position.x).toBe(1);
    expect(plan.steps[0]?.position.y).toBe(0);
    expect(plan.finalPosition.mapId).toBe('MapB');
    expect(plan.finalPosition.position.x).toBe(2);
    expect(plan.finalPosition.position.y).toBe(2);
  });

  it('throws when no path exists', () => {
    map.setTerrain(1, 0, 'water');
    map.setTerrain(0, 1, 'water');

    const start: IMapPosition = {
      mapId: 'MapA',
      position: new Position(0, 0),
    };
    const target: IMapPosition = {
      mapId: 'MapA',
      position: new Position(2, 2),
    };

    expect(() => planMovementSteps(world, start, target, 3)).toThrow(
      'No path found'
    );
  });
});
