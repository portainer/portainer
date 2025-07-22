import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { GenericResource } from '@/react/kubernetes/helm/types';

import { ResourcesTable } from './ResourcesTable';

// Mock the necessary hooks
const mockUseCurrentStateAndParams = vi.fn();
const mockUseEnvironmentId = vi.fn();
const mockUseHelmRelease = vi.fn();

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: () => mockUseCurrentStateAndParams(),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => mockUseEnvironmentId(),
}));

vi.mock('@/react/kubernetes/helm/helmReleaseQueries/useHelmRelease', () => ({
  useHelmRelease: () => mockUseHelmRelease(),
}));

const successResources = [
  {
    kind: 'ValidatingWebhookConfiguration',
    apiVersion: 'admissionregistration.k8s.io/v1',
    metadata: {
      name: 'ingress-nginx-1743063493-admission',
      uid: 'e5388792-c184-479d-9133-390759c4bded',
      labels: {
        'app.kubernetes.io/name': 'ingress-nginx',
      },
    },
    status: {
      healthSummary: {
        status: 'Healthy',
        reason: 'Exists',
      },
    },
  },
  {
    kind: 'Deployment',
    apiVersion: 'apps/v1',
    metadata: {
      name: 'ingress-nginx-1743063493-controller2',
      namespace: 'default',
      uid: 'dcfe325b-7065-47ed-91e3-47f60301cf2e',
      labels: {
        'app.kubernetes.io/name': 'ingress-nginx',
      },
    },
    status: {
      healthSummary: {
        status: 'Healthy',
        reason: 'MinimumReplicasAvailable',
        message: 'Deployment has minimum availability.',
      },
    },
  },
  {
    kind: 'Pod',
    apiVersion: 'v1',
    metadata: {
      name: 'ingress-nginx-1743063493-controller2-54d8f7d8c5-lsf9p',
      generateName: 'ingress-nginx-1743063493-controller2-54d8f7d8c5-',
      namespace: 'default',
      uid: '7176ad7c-0f83-4a65-a45e-d40076adc302',
      labels: {
        'app.kubernetes.io/name': 'ingress-nginx',
        'pod-template-hash': '54d8f7d8c5',
      },
    },
    status: {
      phase: 'Running',
      healthSummary: {
        status: 'Unknown',
        reason: 'Running',
      },
      hostIP: '198.19.249.2',
      startTime: '2025-03-27T20:39:05Z',
    },
  },
];
const failedResources = [
  {
    kind: 'PodDisruptionBudget',
    metadata: {
      name: 'probe-failure-nginx-bad',
      namespace: 'my-namespace',
      uid: 'e4e15f7a-9a68-448e-86b3-d74ef29c718c',
      labels: {
        'app.kubernetes.io/name': 'nginx',
      },
    },
    status: {
      healthSummary: {
        status: 'Unhealthy',
        reason: 'InsufficientPods',
      },
    },
  },
  {
    kind: 'Service',
    apiVersion: 'v1',
    metadata: {
      name: 'probe-failure-nginx',
      namespace: 'my-namespace',
      uid: 'de9cdffc-6af8-43b2-9750-3ac764b25627',
      labels: {
        'app.kubernetes.io/name': 'nginx',
      },
    },
    status: {
      healthSummary: {
        status: 'Healthy',
        reason: 'Exists',
      },
    },
  },
];

function renderResourcesTable(resources: GenericResource[]) {
  // Setup mock return values
  mockUseEnvironmentId.mockReturnValue(3);
  mockUseCurrentStateAndParams.mockReturnValue({
    params: {
      name: 'test-release',
      namespace: 'default',
    },
  });
  mockUseHelmRelease.mockReturnValue({
    data: {
      info: {
        resources,
      },
    },
    isLoading: false,
    error: null,
  });

  const Wrapped = withTestQueryProvider(withTestRouter(ResourcesTable));
  return render(<Wrapped />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ResourcesTable', () => {
  it('should show successful resources, including a link for the deployment and a message', () => {
    renderResourcesTable(successResources);

    // Check that the deployment is rendered with a link
    const deploymentLink = screen.getByText(
      'ingress-nginx-1743063493-controller2'
    );
    expect(deploymentLink).toBeInTheDocument();
    expect(deploymentLink.closest('a')).toHaveTextContent(
      'ingress-nginx-1743063493-controller2'
    );

    // Check that success badge is rendered
    const successBadge = screen.getByText(
      (content, element) =>
        content.includes('MinimumReplicasAvailable') &&
        element !== null &&
        element.className.includes('bg-success')
    );
    expect(successBadge).toBeInTheDocument();
  });

  it('should show error badges for failed resources', () => {
    renderResourcesTable(failedResources);
    expect(screen.getByText('probe-failure-nginx-bad')).toBeInTheDocument();

    // Check for the unhealthy status badge and make sure it has the error styling
    const errorBadge = screen.getByText(
      (content, element) =>
        content.includes('InsufficientPods') &&
        element !== null &&
        element.className.includes('bg-error')
    );
    expect(errorBadge).toBeInTheDocument();
  });
});
