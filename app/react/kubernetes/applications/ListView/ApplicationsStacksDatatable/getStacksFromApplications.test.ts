import { Application } from '../ApplicationsDatatable/types';

import { getStacksFromApplications } from './getStacksFromApplications';
import { Stack } from './types';

function buildApplication(application: Partial<Application>): Application {
  return {
    Id: '1',
    Name: 'app',
    CreationDate: '2021-10-01T00:00:00Z',
    ResourcePool: 'namespace1',
    Image: 'image1',
    ApplicationType: 'Pod',
    DeploymentType: 'Replicated',
    Status: 'status1',
    TotalPodsCount: 1,
    RunningPodsCount: 1,
    ...application,
  };
}

describe('getStacksFromApplications', () => {
  test('should return an empty array when passed an empty array', () => {
    expect(getStacksFromApplications([])).toHaveLength(0);
  });

  test('should ignore applications that have no stack id', () => {
    const appsWithoutStacks = [
      buildApplication({ Name: 'app1' }),
      buildApplication({ Name: 'app2', StackId: '' }),
      buildApplication({ Name: 'app3', StackName: 'stack1' }),
    ];

    expect(getStacksFromApplications(appsWithoutStacks)).toHaveLength(0);
  });

  test("should ignore applications carrying the placeholder stack id '0'", () => {
    const appsWithPlaceholderStackId = [
      buildApplication({ Name: 'app1', StackId: '0' }),
      buildApplication({ Name: 'app2', StackId: '0', StackName: 'stack1' }),
    ];

    expect(getStacksFromApplications(appsWithPlaceholderStackId)).toHaveLength(
      0
    );
  });

  test('should group applications by stack id', () => {
    const app1 = buildApplication({
      Name: 'app1',
      StackId: '1',
      StackName: 'stack1',
    });
    const app2 = buildApplication({
      Name: 'app2',
      StackId: '1',
      StackName: 'stack1',
    });
    const app3 = buildApplication({
      Name: 'app3',
      StackId: '2',
      StackName: 'stack2',
    });

    const expected: Stack[] = [
      {
        Id: '1',
        Name: 'stack1',
        Applications: [app1, app2],
        Highlighted: false,
      },
      {
        Id: '2',
        Name: 'stack2',
        Applications: [app3],
        Highlighted: false,
      },
    ];

    expect(getStacksFromApplications([app1, app2, app3])).toEqual(expected);
  });

  test('should group a stack spanning several namespaces into a single stack', () => {
    const app1 = buildApplication({
      Name: 'app1',
      StackId: '1',
      StackName: 'stack1',
      ResourcePool: 'namespace1',
    });
    const app2 = buildApplication({
      Name: 'app2',
      StackId: '1',
      StackName: 'stack1',
      ResourcePool: 'namespace2',
    });

    const expected: Stack[] = [
      {
        Id: '1',
        Name: 'stack1',
        Applications: [app1, app2],
        Highlighted: false,
      },
    ];

    expect(getStacksFromApplications([app1, app2])).toEqual(expected);
  });

  test('should keep stacks that have an empty name', () => {
    const app1 = buildApplication({ Name: 'app1', StackId: '1' });
    const app2 = buildApplication({ Name: 'app2', StackId: '1' });

    const expected: Stack[] = [
      {
        Id: '1',
        Name: '',
        Applications: [app1, app2],
        Highlighted: false,
      },
    ];

    expect(getStacksFromApplications([app1, app2])).toEqual(expected);
  });

  test('should not group unrelated stacks that share a name', () => {
    const app1 = buildApplication({
      Name: 'app1',
      StackId: '1',
      StackName: 'stack1',
    });
    const app2 = buildApplication({
      Name: 'app2',
      StackId: '2',
      StackName: 'stack1',
    });

    const stacks = getStacksFromApplications([app1, app2]);

    expect(stacks).toHaveLength(2);
    expect(stacks.map((stack) => stack.Id)).toEqual(['1', '2']);
  });
});
