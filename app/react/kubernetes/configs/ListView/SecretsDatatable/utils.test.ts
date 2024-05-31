import { CronJob, Job } from 'kubernetes-types/batch/v1';
import { Secret, Pod } from 'kubernetes-types/core/v1';

import { getIsSecretInUse } from './utils';

describe('getIsSecretInUse', () => {
  it('should return false when no resources reference the secret', () => {
    const secret: Secret = {
      metadata: { name: 'my-secret', namespace: 'default' },
    };
    const pods: Pod[] = [];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(false);
  });

  it('should return true when a pod references the secret', () => {
    const secret: Secret = {
      metadata: { name: 'my-secret', namespace: 'default' },
    };
    const pods: Pod[] = [
      {
        metadata: { namespace: 'default' },
        spec: {
          containers: [
            {
              name: 'container1',
              envFrom: [{ secretRef: { name: 'my-secret' } }],
            },
          ],
        },
      },
    ];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a job references the secret', () => {
    const secret: Secret = {
      metadata: { name: 'my-secret', namespace: 'default' },
    };
    const pods: Pod[] = [];
    const jobs: Job[] = [
      {
        metadata: { namespace: 'default' },
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'container1',
                  envFrom: [{ secretRef: { name: 'my-secret' } }],
                },
              ],
            },
          },
        },
      },
    ];
    const cronJobs: CronJob[] = [];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a cronJob references the secret', () => {
    const secret: Secret = {
      metadata: { name: 'my-secret', namespace: 'default' },
    };
    const pods: Pod[] = [];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [
      {
        metadata: { namespace: 'default' },
        spec: {
          schedule: '0 0 * * *',
          jobTemplate: {
            spec: {
              template: {
                spec: {
                  containers: [
                    {
                      name: 'container1',
                      envFrom: [{ secretRef: { name: 'my-secret' } }],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ];

    expect(getIsSecretInUse(secret, pods, jobs, cronJobs)).toBe(true);
  });
});
