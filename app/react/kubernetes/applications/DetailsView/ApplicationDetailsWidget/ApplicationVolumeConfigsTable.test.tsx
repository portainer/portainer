import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';

import { Application } from '../../types';

import { ApplicationVolumeConfigsTable } from './ApplicationVolumeConfigsTable';

// Mock icon components
vi.mock('lucide-react', () => ({
  Asterisk: () => <span data-cy="asterisk-icon" />,
  Plus: () => <span data-cy="plus-icon" />,
}));

// Mock UI components
vi.mock('@@/Icon', () => ({
  Icon: ({
    icon: IconComponent,
    ...props
  }: {
    icon: React.ComponentType;
    [key: string]: unknown;
  }) => <IconComponent {...props} />,
}));

// Mock the Link component to capture routing props
const mockLink = vi.fn();
vi.mock('@@/Link', () => ({
  Link: ({
    children,
    to,
    params,
    'data-cy': dataCy,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    params: Record<string, string>;
    'data-cy'?: string;
    className?: string;
  }) => {
    mockLink({ children, to, params, 'data-cy': dataCy, className });
    return (
      <span
        data-cy={dataCy}
        data-testid={dataCy}
        role="link"
        data-to={to}
        data-params={JSON.stringify(params)}
        className={className}
      >
        {children}
      </span>
    );
  },
}));

describe('ApplicationVolumeConfigsTable', () => {
  beforeEach(() => {
    mockLink.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when there are no volume configurations', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    const { container } = render(
      <ApplicationVolumeConfigsTable namespace="default" app={app} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when app is undefined', () => {
    const { container } = render(
      <ApplicationVolumeConfigsTable namespace="default" app={undefined} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render volume configurations from configmaps with items', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'config-volume',
                mountPath: '/etc/config',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'config-volume',
            configMap: {
              name: 'test-configmap',
              items: [
                {
                  key: 'config-key',
                  path: 'config.yaml',
                },
              ],
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/config/config.yaml')).toBeInTheDocument();
    expect(screen.getByText('config-key')).toBeInTheDocument();
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(2); // One for value, one for link
    expect(screen.getByText('test-configmap')).toBeInTheDocument();

    // Verify the Link component was called with correct routing parameters
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
        params: {
          name: 'test-configmap',
          namespace: 'default',
        },
        'data-cy': 'config-link-test-configmap',
      })
    );
  });

  it('should render volume configurations from secrets with items', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'secret-volume',
                mountPath: '/etc/secrets',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'secret-volume',
            secret: {
              secretName: 'test-secret',
              items: [
                {
                  key: 'secret-key',
                  path: 'secret.txt',
                },
              ],
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/secrets/secret.txt')).toBeInTheDocument();
    expect(screen.getByText('secret-key')).toBeInTheDocument();
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(2); // One for value, one for link
    expect(screen.getByText('test-secret')).toBeInTheDocument();

    // Verify the Link component was called with correct routing parameters for secret
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
        params: {
          name: 'test-secret',
          namespace: 'default',
        },
        'data-cy': 'secret-link-test-secret',
      })
    );
  });

  it('should render init containers with asterisk indicator', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'main-container',
            image: 'main-image',
            volumeMounts: [
              {
                name: 'config-volume',
                mountPath: '/etc/config',
              },
            ],
          },
        ],
        initContainers: [
          {
            name: 'init-container',
            image: 'init-image',
            volumeMounts: [
              {
                name: 'config-volume',
                mountPath: '/etc/init-config',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'config-volume',
            configMap: {
              name: 'shared-config',
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    // Check main container
    expect(screen.getByText('main-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/config')).toBeInTheDocument();

    // Check init container
    expect(screen.getByText('init-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/init-config')).toBeInTheDocument();
    expect(screen.getByTestId('asterisk-icon')).toBeInTheDocument();
    expect(screen.getByText('init container')).toBeInTheDocument();
  });

  it('should render secret volume configurations correctly based on type', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'secret-volume',
                mountPath: '/etc/secrets',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'secret-volume',
            secret: {
              secretName: 'test-secret',
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('test-secret')).toBeInTheDocument();

    // Should route to secret page because type is 'secret'
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
        params: {
          name: 'test-secret',
          namespace: 'default',
        },
        'data-cy': 'secret-link-test-secret',
      })
    );
  });

  it('should render configmap volume configurations correctly based on type', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'config-volume',
                mountPath: '/etc/config',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'config-volume',
            configMap: {
              name: 'test-configmap',
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('test-configmap')).toBeInTheDocument();

    // Should route to configmap page because type is 'configMap'
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
        params: {
          name: 'test-configmap',
          namespace: 'default',
        },
        'data-cy': 'config-link-test-configmap',
      })
    );
  });

  it('should handle volumes without items (entire volume mount)', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'config-volume',
                mountPath: '/etc/config',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'config-volume',
            configMap: {
              name: 'test-configmap',
              // No items - entire configmap is mounted
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/config')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // No specific key
    expect(screen.getByText('test-configmap')).toBeInTheDocument();
  });

  it('should handle multiple volumes with different types correctly', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'secret-volume',
                mountPath: '/etc/secrets',
              },
              {
                name: 'config-volume',
                mountPath: '/etc/config',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'secret-volume',
            secret: {
              secretName: 'test-secret',
            },
          },
          {
            name: 'config-volume',
            configMap: {
              name: 'test-configmap',
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getAllByText('test-container')).toHaveLength(2); // Should appear twice - once for each volume
    expect(screen.getByText('test-secret')).toBeInTheDocument();
    expect(screen.getByText('test-configmap')).toBeInTheDocument();

    // Should have made two Link calls - one for secret, one for configmap
    expect(mockLink).toHaveBeenCalledTimes(2);

    // Verify secret link
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
        params: {
          name: 'test-secret',
          namespace: 'default',
        },
        'data-cy': 'secret-link-test-secret',
      })
    );

    // Verify configmap link
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
        params: {
          name: 'test-configmap',
          namespace: 'default',
        },
        'data-cy': 'config-link-test-configmap',
      })
    );
  });

  it('should handle containers without volume mounts', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            // No volumeMounts
          },
        ],
        volumes: [
          {
            name: 'config-volume',
            configMap: {
              name: 'test-configmap',
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    const { container } = render(
      <ApplicationVolumeConfigsTable namespace="default" app={app} />
    );

    // Should render nothing because there are no matching volume mounts
    expect(container.firstChild).toBeNull();
  });

  it('should handle Deployment kind applications', () => {
    const app: Application = {
      metadata: { name: 'test-deployment', namespace: 'default' },
      spec: {
        selector: {
          matchLabels: {
            app: 'test-app',
          },
        },
        template: {
          spec: {
            containers: [
              {
                name: 'test-container',
                image: 'test-image',
                volumeMounts: [
                  {
                    name: 'config-volume',
                    mountPath: '/etc/config',
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'config-volume',
                configMap: {
                  name: 'test-configmap',
                },
              },
            ],
          },
        },
      },
      kind: 'Deployment',
      apiVersion: 'apps/v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/config')).toBeInTheDocument();
    expect(screen.getByText('test-configmap')).toBeInTheDocument();
  });

  it('should handle missing volume config names', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            volumeMounts: [
              {
                name: 'config-volume',
                mountPath: '/etc/config',
              },
            ],
          },
        ],
        volumes: [
          {
            name: 'config-volume',
            configMap: {
              // name is undefined
            },
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationVolumeConfigsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('/etc/config')).toBeInTheDocument();

    // Should show dash for missing volume config name
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });
});
