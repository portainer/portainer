import { ContainerStatus } from 'kubernetes-types/core/v1';

import { computeContainerStatus } from './computeContainerStatus';

// Helper to create a base ContainerStatus with required properties
function createContainerStatus(
  overrides: Partial<ContainerStatus>
): ContainerStatus {
  return {
    name: 'test-container',
    ready: false,
    restartCount: 0,
    image: 'test-image:latest',
    imageID: 'sha256:test123',
    ...overrides,
  };
}

describe('computeContainerStatus', () => {
  describe('Critical Container States', () => {
    test('ImagePullBackOff should return danger type with no logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          waiting: {
            reason: 'ImagePullBackOff',
            message: 'Failed to pull image',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('ImagePullBackOff');
      expect(result.type).toBe('danger');
      expect(result.hasLogs).toBe(false);
    });

    test('ImagePullBackOff with containerID should return danger type with logs', () => {
      const containerStatus = createContainerStatus({
        containerID: 'docker://abc123def456',
        state: {
          waiting: {
            reason: 'ImagePullBackOff',
            message: 'Failed to pull image',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('ImagePullBackOff');
      expect(result.type).toBe('danger');
      expect(result.hasLogs).toBe(true);
    });

    test('CrashLoopBackOff should return danger type with logs if container started', () => {
      const containerStatus = createContainerStatus({
        restartCount: 5,
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
            message: 'Back-off restarting failed container',
          },
        },
        lastState: {
          terminated: {
            startedAt: '2023-01-01T10:00:00Z',
            exitCode: 1,
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('CrashLoopBackOff');
      expect(result.type).toBe('danger');
      expect(result.hasLogs).toBe(true);
    });

    test('CrashLoopBackOff with only containerID should return danger type with logs', () => {
      const containerStatus = createContainerStatus({
        containerID: 'docker://crashed123',
        restartCount: 3,
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
            message: 'Back-off restarting failed container',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('CrashLoopBackOff');
      expect(result.type).toBe('danger');
      expect(result.hasLogs).toBe(true);
    });

    test('Running and ready should return success type with logs', () => {
      const containerStatus = createContainerStatus({
        ready: true,
        state: {
          running: {
            startedAt: '2023-01-01T10:00:00Z',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('Running');
      expect(result.type).toBe('success');
      expect(result.hasLogs).toBe(true);
    });

    test('Running but not ready should return warn type with logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          running: {
            startedAt: '2023-01-01T10:00:00Z',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('Running (not ready)');
      expect(result.type).toBe('warn');
      expect(result.hasLogs).toBe(true);
    });

    test('OOMKilled should return danger type with logs', () => {
      const containerStatus = createContainerStatus({
        restartCount: 2,
        state: {
          terminated: {
            reason: 'OOMKilled',
            exitCode: 137,
            startedAt: '2023-01-01T10:00:00Z',
            finishedAt: '2023-01-01T10:05:00Z',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('OOMKilled');
      expect(result.type).toBe('danger');
      expect(result.hasLogs).toBe(true);
    });

    test('Completed successfully should return success type with logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          terminated: {
            reason: 'Completed',
            exitCode: 0,
            startedAt: '2023-01-01T10:00:00Z',
            finishedAt: '2023-01-01T10:05:00Z',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('Completed');
      expect(result.type).toBe('success');
      expect(result.hasLogs).toBe(true);
    });

    test('ContainerCreating should return info type with no logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          waiting: {
            reason: 'ContainerCreating',
            message: 'Container is being created',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('ContainerCreating');
      expect(result.type).toBe('info');
      expect(result.hasLogs).toBe(false);
    });

    test('ContainerCreating with containerID should return info type with logs', () => {
      const containerStatus = createContainerStatus({
        containerID: 'docker://creating123',
        state: {
          waiting: {
            reason: 'ContainerCreating',
            message: 'Container is being created',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('ContainerCreating');
      expect(result.type).toBe('info');
      expect(result.hasLogs).toBe(true);
    });

    test('PodInitializing should return info type with prefixed status', () => {
      const containerStatus = createContainerStatus({
        state: {
          waiting: {
            reason: 'PodInitializing',
            message: 'Waiting for init containers',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('Waiting (PodInitializing)');
      expect(result.type).toBe('info');
      expect(result.hasLogs).toBe(false);
    });

    test('Container not found should return unknown with muted type', () => {
      const result = computeContainerStatus('nonexistent-container', []);

      expect(result.status).toBe('Unknown');
      expect(result.type).toBe('muted');
      expect(result.hasLogs).toBeUndefined();
    });

    test('Container with no state should return unknown with muted type', () => {
      const containerStatus = createContainerStatus({
        state: {},
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('Unknown');
      expect(result.type).toBe('muted');
      expect(result.hasLogs).toBe(false);
    });

    test('Container with no state but with containerID should have logs available', () => {
      const containerStatus = createContainerStatus({
        containerID: 'docker://unknown123',
        state: {},
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.status).toBe('Unknown');
      expect(result.type).toBe('muted');
      expect(result.hasLogs).toBe(true);
    });

    test('Sidecar container should be handled like regular container', () => {
      const containerStatus = createContainerStatus({
        ready: true,
        state: {
          running: {
            startedAt: '2023-01-01T10:00:00Z',
          },
        },
      });

      const result = computeContainerStatus(
        'test-container',
        [],
        [containerStatus]
      ); // Sidecar containers are found in initContainerStatuses

      expect(result.status).toBe('Running');
      expect(result.type).toBe('success');
      expect(result.hasLogs).toBe(true);
    });
  });

  describe('Container Log Availability Tests', () => {
    test('Container with running state should have logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          running: {
            startedAt: '2023-01-01T10:00:00Z',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(true);
    });

    test('Container with terminated state should have logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          terminated: {
            startedAt: '2023-01-01T10:00:00Z',
            exitCode: 0,
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(true);
    });

    test('Container with lastState running should have logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
          },
        },
        lastState: {
          running: {
            startedAt: '2023-01-01T10:00:00Z',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(true);
    });

    test('Container with lastState terminated should have logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          waiting: {
            reason: 'CrashLoopBackOff',
          },
        },
        lastState: {
          terminated: {
            startedAt: '2023-01-01T10:00:00Z',
            exitCode: 1,
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(true);
    });

    test('Container with only containerID should have logs', () => {
      const containerStatus = createContainerStatus({
        containerID: 'docker://abc123def456',
        state: {
          waiting: {
            reason: 'Unknown',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(true);
    });

    test('Container with empty containerID should not have logs', () => {
      const containerStatus = createContainerStatus({
        containerID: '',
        state: {
          waiting: {
            reason: 'ImagePullBackOff',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(false);
    });

    test('Container without containerID or start times should not have logs', () => {
      const containerStatus = createContainerStatus({
        state: {
          waiting: {
            reason: 'ImagePullBackOff',
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(false);
    });

    test('Container with terminated state but no startedAt should rely on containerID', () => {
      const containerStatus = createContainerStatus({
        containerID: 'docker://terminated123',
        state: {
          terminated: {
            exitCode: 0,
            // No startedAt field
          },
        },
      });

      const result = computeContainerStatus('test-container', [
        containerStatus,
      ]);

      expect(result.hasLogs).toBe(true);
    });

    test('Multiple containers with different log availability', () => {
      const containerWithLogs = createContainerStatus({
        name: 'container-with-logs',
        containerID: 'docker://logs123',
        state: {
          running: {
            startedAt: '2023-01-01T10:00:00Z',
          },
        },
      });

      const containerWithoutLogs = createContainerStatus({
        name: 'container-without-logs',
        state: {
          waiting: {
            reason: 'ImagePullBackOff',
          },
        },
      });

      const resultWithLogs = computeContainerStatus('container-with-logs', [
        containerWithLogs,
        containerWithoutLogs,
      ]);

      const resultWithoutLogs = computeContainerStatus(
        'container-without-logs',
        [containerWithLogs, containerWithoutLogs]
      );

      expect(resultWithLogs.hasLogs).toBe(true);
      expect(resultWithoutLogs.hasLogs).toBe(false);
    });
  });
});
