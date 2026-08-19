import { ContainerStatus } from 'kubernetes-types/core/v1';

import { ContainerRowData } from './types';

/**
 * Compute the status of a container, with translated messages.
 *
 * The cases are hardcoded, because there is not a single source that enumerates
 * all the possible states.
 * @param containerName - The name of the container
 * @param containerStatuses - The statuses of the container
 * @param initContainerStatuses - The statuses of the init container
 * @returns The status of the container
 */
export function computeContainerStatus(
  containerName: string,
  containerStatuses?: ContainerStatus[],
  initContainerStatuses?: ContainerStatus[]
): ContainerRowData['status'] {
  // Choose the correct status array based on container type
  const statuses = [
    ...(containerStatuses || []),
    ...(initContainerStatuses || []),
  ];
  const status = statuses?.find((status) => status.name === containerName);

  if (!status) {
    return {
      status: 'Unknown',
      type: 'muted',
      message: 'Container status information is not available',
    };
  }

  const hasLogs = hasContainerEverStarted(status);
  const { state, restartCount = 0 } = status;

  // Handle waiting state with more specific reasons
  if (state?.waiting) {
    const { reason, message } = state.waiting;
    if (reason) {
      // Return specific waiting reasons that match kubectl output
      switch (reason) {
        case 'ImagePullBackOff':
        case 'ErrImagePull':
        case 'ImageInspectError':
        case 'ErrImageNeverPull':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'Failed to pull container image. Check image name, registry access, and network connectivity.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'ContainerCreating':
          return {
            status: reason,
            type: 'info',
            message:
              message ||
              'Container is being created. This may take a few moments.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'info')
              ? restartCount
              : undefined,
          };
        case 'PodInitializing':
          return {
            status: `Waiting (${reason})`,
            type: 'info',
            message:
              message ||
              'Waiting for init containers to complete. Wait a few moments or check the logs of any init containers that failed to complete.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'info')
              ? restartCount
              : undefined,
          };
        case 'CreateContainerConfigError':
        case 'CreateContainerError':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'Failed to create container. Check resource limits, security contexts, and volume mounts.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'InvalidImageName':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'The specified container image name is invalid or malformed.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'CrashLoopBackOff':
          return {
            status: reason,
            type: 'danger',
            message: `Container keeps crashing after startup. Check application logs and startup configuration. ${
              message ? `Details: '${message}'` : ''
            }`,
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'RunContainerError':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'Failed to start container process. Check command, arguments, and environment variables.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'KillContainerError':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'Failed to stop container gracefully. Container may be unresponsive.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'VerifyNonRootError':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'Container is trying to run as root but security policy requires non-root execution.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'ConfigError':
          return {
            status: reason,
            type: 'danger',
            message:
              message ||
              'Container configuration is invalid. Check resource requirements and security settings.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        default:
          return {
            status: reason,
            type: 'muted',
            message: message || `Container is waiting: ${reason}`,
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'muted')
              ? restartCount
              : undefined,
          };
      }
    }
    return {
      status: 'Waiting',
      type: 'muted',
      message: message || 'Container is waiting to be scheduled or started.',
      hasLogs,
      restartCount: shouldShowRestartCount(restartCount, 'muted')
        ? restartCount
        : undefined,
    };
  }

  // Handle terminated state
  if (state?.terminated) {
    const { exitCode = 0, reason, message } = state.terminated;

    if (reason) {
      switch (reason) {
        case 'Error':
          return {
            status: 'Error',
            type: 'danger',
            message: `Container exited with code ${exitCode}${
              restartCount > 0 ? ` (restarted ${restartCount} times)` : ''
            }. ${message || 'Check application logs for error details.'}`,
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'Completed':
          return {
            status: 'Completed',
            type: 'success',
            message,
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'success')
              ? restartCount
              : undefined,
          };
        case 'OOMKilled':
          return {
            status: 'OOMKilled',
            type: 'danger',
            message:
              message ||
              'Container was killed due to out-of-memory. Consider increasing memory limits.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'DeadlineExceeded':
          return {
            status: 'DeadlineExceeded',
            type: 'danger',
            message:
              message ||
              'Container was terminated because it exceeded the active deadline.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        case 'Evicted':
          return {
            status: 'Evicted',
            type: 'warn',
            message:
              message ||
              'Container was evicted due to resource pressure on the node.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'warn')
              ? restartCount
              : undefined,
          };
        case 'NodeLost':
          return {
            status: 'NodeLost',
            type: 'danger',
            message:
              message || 'Container was lost when the node became unreachable.',
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'danger')
              ? restartCount
              : undefined,
          };
        default:
          return {
            status: reason,
            type: 'muted',
            message: `Container terminated: ${reason}${
              restartCount > 0 ? ` (restarted ${restartCount} times)` : ''
            }. ${message || ''}`,
            hasLogs,
            restartCount: shouldShowRestartCount(restartCount, 'muted')
              ? restartCount
              : undefined,
          };
      }
    }

    if (exitCode === 0) {
      return {
        status: 'Completed',
        type: 'success',
        message,
        hasLogs,
        restartCount: shouldShowRestartCount(restartCount, 'success')
          ? restartCount
          : undefined,
      };
    }

    return {
      status: 'Error',
      type: 'danger',
      message: `Container exited with code ${exitCode}${
        restartCount > 0 ? ` (restarted ${restartCount} times)` : ''
      }. ${message || 'Check application logs for error details.'}`,
      hasLogs,
      restartCount: shouldShowRestartCount(restartCount, 'danger')
        ? restartCount
        : undefined,
    };
  }

  // Handle running state
  if (state?.running) {
    // Check if container is ready
    if (status.ready === false) {
      return {
        status: 'Running (not ready)',
        type: 'warn',
        message:
          'Container is running but not ready. Check readiness probe configuration.',
        hasLogs,
        restartCount: shouldShowRestartCount(restartCount, 'warn')
          ? restartCount
          : undefined,
      };
    }
    return {
      status: 'Running',
      type: 'success',
      hasLogs,
      restartCount: shouldShowRestartCount(restartCount, 'success')
        ? restartCount
        : undefined,
    };
  }

  // Fallback
  return {
    status: 'Unknown',
    type: 'muted',
    message:
      'Container state cannot be determined. Status information may be incomplete.',
    hasLogs,
    restartCount: shouldShowRestartCount(restartCount, 'muted')
      ? restartCount
      : undefined,
  };
}

// Helper function to determine if restart count should be shown
function shouldShowRestartCount(
  restartCount: number,
  type: ContainerRowData['status']['type']
) {
  return restartCount >= 1 && (type === 'danger' || type === 'warn');
}

function hasContainerEverStarted(status: ContainerStatus): boolean {
  return (
    !!status.state?.running?.startedAt ||
    !!status.state?.terminated?.startedAt ||
    !!status.lastState?.running?.startedAt ||
    !!status.lastState?.terminated?.startedAt ||
    !!status.containerID
  );
}
