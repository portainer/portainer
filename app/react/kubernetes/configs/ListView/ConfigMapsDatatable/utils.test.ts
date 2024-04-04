import { ConfigMap, Pod } from 'kubernetes-types/core/v1';
import { CronJob, Job } from 'kubernetes-types/batch/v1';

import { getIsConfigMapInUse } from './utils';

describe('getIsConfigMapInUse', () => {
  it('should return false when no resources reference the configMap', () => {
    const configMap: ConfigMap = {
      metadata: { name: 'my-configmap', namespace: 'default' },
    };
    const pods: Pod[] = [];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(false);
  });

  it('should return true when a pod references the configMap', () => {
    const configMap: ConfigMap = {
      metadata: { name: 'my-configmap', namespace: 'default' },
    };
    const pods: Pod[] = [
      {
        metadata: { namespace: 'default' },
        spec: {
          containers: [
            {
              name: 'container1',
              envFrom: [{ configMapRef: { name: 'my-configmap' } }],
            },
          ],
        },
      },
    ];
    const jobs: Job[] = [];
    const cronJobs: CronJob[] = [];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a job references the configMap', () => {
    const configMap: ConfigMap = {
      metadata: { name: 'my-configmap', namespace: 'default' },
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
                  envFrom: [{ configMapRef: { name: 'my-configmap' } }],
                },
              ],
            },
          },
        },
      },
    ];
    const cronJobs: CronJob[] = [];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(true);
  });

  it('should return true when a cronJob references the configMap', () => {
    const configMap: ConfigMap = {
      metadata: { name: 'my-configmap', namespace: 'default' },
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
                      envFrom: [{ configMapRef: { name: 'my-configmap' } }],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    ];

    expect(getIsConfigMapInUse(configMap, pods, jobs, cronJobs)).toBe(true);
  });
});
