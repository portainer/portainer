import { Service } from 'docker-types';

import { PortainerResponse } from '@/react/docker/types';

import { ServiceViewModel } from './service';

function buildService(
  mode: Service['Spec']['Mode']
): PortainerResponse<Service> {
  return {
    ID: 'service-id',
    Spec: {
      Name: 'my-service',
      Mode: mode,
    },
  };
}

describe('ServiceViewModel scheduling mode', () => {
  it('detects replicated mode and its replica count', () => {
    const model = new ServiceViewModel(
      buildService({ Replicated: { Replicas: 3 } })
    );

    expect(model.Mode).toBe('replicated');
    expect(model.Replicas).toBe(3);
  });

  it('detects global mode', () => {
    const model = new ServiceViewModel(buildService({ Global: {} }));

    expect(model.Mode).toBe('global');
    expect(model.Replicas).toBeUndefined();
  });

  it('detects replicated-job mode and uses total completions as replicas', () => {
    const model = new ServiceViewModel(
      buildService({ ReplicatedJob: { MaxConcurrent: 1, TotalCompletions: 5 } })
    );

    expect(model.Mode).toBe('replicated-job');
    expect(model.Replicas).toBe(5);
  });

  it('detects global-job mode', () => {
    const model = new ServiceViewModel(buildService({ GlobalJob: {} }));

    expect(model.Mode).toBe('global-job');
    expect(model.Replicas).toBeUndefined();
  });

  it('falls back to global when the mode is missing', () => {
    const model = new ServiceViewModel(buildService(undefined));

    expect(model.Mode).toBe('global');
    expect(model.Replicas).toBeUndefined();
  });
});
