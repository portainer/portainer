import { Application } from '../ApplicationsDatatable/types';

import { getStacksFromApplications } from './getStacksFromApplications';
import { Stack } from './types';

describe('getStacksFromApplications', () => {
  test('should return an empty array when passed an empty array', () => {
    expect(getStacksFromApplications([])).toHaveLength(0);
  });

  test('should return an empty array when passed a list of applications without stacks', () => {
    const appsWithoutStacks: Application[] = [
      {
        StackName: '',
        Id: '1',
        Name: 'app1',
        CreationDate: '2021-10-01T00:00:00Z',
        ResourcePool: 'namespace1',
        Image: 'image1',
        ApplicationType: 'Pod',
        DeploymentType: 'Replicated',
        Status: 'status1',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
      },
      {
        StackName: '',
        Id: '1',
        Name: 'app2',
        CreationDate: '2021-10-01T00:00:00Z',
        ResourcePool: 'namespace1',
        Image: 'image1',
        ApplicationType: 'Pod',
        DeploymentType: 'Replicated',
        Status: 'status1',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
      },
      {
        StackName: '',
        Id: '1',
        Name: 'app3',
        CreationDate: '2021-10-01T00:00:00Z',
        ResourcePool: 'namespace1',
        Image: 'image1',
        ApplicationType: 'Pod',
        DeploymentType: 'Replicated',
        Status: 'status1',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
      },
    ];
    expect(getStacksFromApplications(appsWithoutStacks)).toHaveLength(0);
  });

  test('should return a list of stacks when passed a list of applications with stacks', () => {
    const appsWithStacks: Application[] = [
      {
        StackName: 'stack1',
        Id: '1',
        Name: 'app1',
        CreationDate: '2021-10-01T00:00:00Z',
        ResourcePool: 'namespace1',
        Image: 'image1',
        ApplicationType: 'Pod',
        DeploymentType: 'Replicated',
        Status: 'status1',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
      },
      {
        StackName: 'stack1',
        Id: '1',
        Name: 'app2',
        CreationDate: '2021-10-01T00:00:00Z',
        ResourcePool: 'namespace1',
        Image: 'image1',
        ApplicationType: 'Pod',
        DeploymentType: 'Replicated',
        Status: 'status1',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
      },
      {
        StackName: 'stack2',
        Id: '1',
        Name: 'app3',
        CreationDate: '2021-10-01T00:00:00Z',
        ResourcePool: 'namespace1',
        Image: 'image1',
        ApplicationType: 'Pod',
        DeploymentType: 'Replicated',
        Status: 'status1',
        TotalPodsCount: 1,
        RunningPodsCount: 1,
      },
    ];

    const expectedStacksWithApps: Stack[] = [
      {
        Name: 'stack1',
        ResourcePool: 'namespace1',
        Applications: [
          {
            StackName: 'stack1',
            Id: '1',
            Name: 'app1',
            CreationDate: '2021-10-01T00:00:00Z',
            ResourcePool: 'namespace1',
            Image: 'image1',
            ApplicationType: 'Pod',
            DeploymentType: 'Replicated',
            Status: 'status1',
            TotalPodsCount: 1,
            RunningPodsCount: 1,
          },
          {
            StackName: 'stack1',
            Id: '1',
            Name: 'app2',
            CreationDate: '2021-10-01T00:00:00Z',
            ResourcePool: 'namespace1',
            Image: 'image1',
            ApplicationType: 'Pod',
            DeploymentType: 'Replicated',
            Status: 'status1',
            TotalPodsCount: 1,
            RunningPodsCount: 1,
          },
        ],
        Highlighted: false,
      },
      {
        Name: 'stack2',
        ResourcePool: 'namespace1',
        Applications: [
          {
            StackName: 'stack2',
            Id: '1',
            Name: 'app3',
            CreationDate: '2021-10-01T00:00:00Z',
            ResourcePool: 'namespace1',
            Image: 'image1',
            ApplicationType: 'Pod',
            DeploymentType: 'Replicated',
            Status: 'status1',
            TotalPodsCount: 1,
            RunningPodsCount: 1,
          },
        ],
        Highlighted: false,
      },
    ];

    expect(getStacksFromApplications(appsWithStacks)).toEqual(
      expectedStacksWithApps
    );
  });
});
