import { CronJob, Job, K8sPod } from '../../../applications/types';
import { Configuration } from '../../types';

import { getIsSecretInUse } from './utils';

describe('getIsSecretInUse', () => {
  it('should return false when no resources reference the secret', () => {
    const secret: Configuration = {
      Name: 'my-secret',
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

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(false);
  });

  it('should return true when a pod references the secret', () => {
    const secret: Configuration = {
      Name: 'my-secret',
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
            envFrom: [{ secretRef: { name: 'my-secret' } }],
          },
        ],
        ownerReferences: [],
      },
    ];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a job references the secret', () => {
    const secret: Configuration = {
      Name: 'my-secret',
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
            envFrom: [{ secretRef: { name: 'my-secret' } }],
          },
        ],
      },
    ];
    const cronJobs: CronJob[] = [];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a cronJob references the secret', () => {
    const secret: Configuration = {
      Name: 'my-secret',
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
            envFrom: [{ secretRef: { name: 'my-secret' } }],
          },
        ],
      },
    ];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(true);
  });
});
