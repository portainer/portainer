import { CronJob, Job, K8sPod } from '../../../applications/types';
import { Configuration } from '../../types';

import { getIsConfigMapInUse } from './utils';

describe('getIsConfigMapInUse', () => {
  it('should return false when no resources reference the configMap', () => {
    const configMap: Configuration = {
      Name: 'my-configmap',
      Namespace: 'default',
      UID: '',
      Type: 1,
      ConfigurationOwner: '',
      ConfigurationOwnerId: '',
      IsUsed: false,
      Yaml: '',
    };
    const pods: K8sPod[] = [];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(false);
  });

  it('should return true when a pod references the configMap', () => {
    const configMap: Configuration = {
      Name: 'my-configmap',
      Namespace: 'default',
      UID: '',
      Type: 1,
      ConfigurationOwner: '',
      ConfigurationOwnerId: '',
      IsUsed: false,
      Yaml: '',
    };
    const pods: K8sPod[] = [
      {
        namespace: 'default',
        containers: [
          {
            name: 'container1',
            envFrom: [{ configMapRef: { name: 'my-configmap' } }],
          },
        ],
        ownerReferences: [],
      },
    ];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a job references the configMap', () => {
    const configMap: Configuration = {
      Name: 'my-configmap',
      Namespace: 'default',
      UID: '',
      Type: 1,
      ConfigurationOwner: '',
      ConfigurationOwnerId: '',
      IsUsed: false,
      Yaml: '',
    };
    const pods: K8sPod[] = [];
    const jobs: Job[] = [
      {
        namespace: 'default',
        containers: [
          {
            name: 'container1',
            envFrom: [{ configMapRef: { name: 'my-configmap' } }],
          },
        ],
      },
    ];
    const cronJobs: CronJob[] = [];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a cronJob references the configMap', () => {
    const configMap: Configuration = {
      Name: 'my-configmap',
      Namespace: 'default',
      UID: '',
      Type: 1,
      ConfigurationOwner: '',
      ConfigurationOwnerId: '',
      IsUsed: false,
      Yaml: '',
    };
    const pods: K8sPod[] = [];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [
      {
        namespace: 'default',
        schedule: '0 0 * * *',
        containers: [
          {
            name: 'container1',
            envFrom: [{ configMapRef: { name: 'my-configmap' } }],
          },
        ],
      },
    ];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(true);
  });
});
