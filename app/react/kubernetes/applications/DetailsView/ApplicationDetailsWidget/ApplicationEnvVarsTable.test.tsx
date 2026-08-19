import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';

import { Application } from '../../types';

import { ApplicationEnvVarsTable } from './ApplicationEnvVarsTable';

// Mock icon components
vi.mock('lucide-react', () => ({
  Asterisk: () => <span data-cy="asterisk-icon" />,
  File: () => <span data-cy="file-icon" />,
  FileCode: () => <span data-cy="file-code-icon" />,
  Key: () => <span data-cy="key-icon" />,
  Lock: () => <span data-cy="lock-icon" />,
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

vi.mock('@@/Tip/TextTip', () => ({
  TextTip: ({
    children,
    color,
  }: {
    children: React.ReactNode;
    color?: string;
  }) => (
    <div data-cy="text-tip" data-color={color}>
      {children}
    </div>
  ),
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

describe('ApplicationEnvVarsTable', () => {
  beforeEach(() => {
    mockLink.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render helpful tip when there are no environment variables', () => {
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

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(
      screen.getByText('Environment variables, ConfigMaps or Secrets')
    ).toBeInTheDocument();
    expect(screen.getByTestId('text-tip')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This application is not using any environment variable, ConfigMap or Secret.'
      )
    ).toBeInTheDocument();
  });

  it('should render nothing when app is undefined', () => {
    render(<ApplicationEnvVarsTable namespace="default" app={undefined} />);

    expect(
      screen.getByText('Environment variables, ConfigMaps or Secrets')
    ).toBeInTheDocument();
    expect(screen.getByTestId('text-tip')).toBeInTheDocument();
  });

  it('should render regular environment variables with direct values', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: 'ENV_VAR',
                value: 'test-value',
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('ENV_VAR')).toBeInTheDocument();
    expect(screen.getByText('test-value')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // No configuration resource
  });

  it('should render configmap environment variables with correct routing', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: 'CONFIG_VAR',
                valueFrom: {
                  configMapKeyRef: {
                    name: 'test-configmap',
                    key: 'config-key',
                  },
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getAllByText('CONFIG_VAR')).toHaveLength(2); // Appears in name and value columns
    // Note: config-key is not displayed in UI - the component shows the env var name
    expect(screen.getByText('test-configmap')).toBeInTheDocument();
    expect(screen.getByTestId('key-icon')).toBeInTheDocument();
    expect(screen.getByTestId('file-code-icon')).toBeInTheDocument();

    // Verify the Link component was called with correct routing parameters
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
        params: {
          name: 'test-configmap',
          namespace: 'default',
        },
        'data-cy': 'configmap-link-test-configmap',
      })
    );
  });

  it('should render secret environment variables with correct routing', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: 'SECRET_VAR',
                valueFrom: {
                  secretKeyRef: {
                    name: 'test-secret',
                    key: 'secret-key',
                  },
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getAllByText('SECRET_VAR')).toHaveLength(2); // Appears in name and value columns
    // Note: secret-key is not displayed in UI - the component shows the env var name
    expect(screen.getByText('test-secret')).toBeInTheDocument();
    expect(screen.getByTestId('key-icon')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();

    // Verify the Link component was called with correct routing parameters for secret
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
        params: {
          name: 'test-secret',
          namespace: 'default',
        },
        'data-cy': 'configmap-link-test-secret',
      })
    );
  });

  it('should render downward API field references', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: 'POD_NAME',
                valueFrom: {
                  fieldRef: {
                    fieldPath: 'metadata.name',
                  },
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('POD_NAME')).toBeInTheDocument();
    expect(
      screen.getByText(
        (content, element) =>
          content.includes('metadata.name') && element?.tagName === 'SPAN'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('downward API')).toBeInTheDocument();
    expect(screen.getByTestId('asterisk-icon')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument(); // No configuration resource
  });

  it('should render envFrom configmap (entire configmap import)', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            envFrom: [
              {
                configMapRef: {
                  name: 'entire-configmap',
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2); // EnvFrom doesn't have a specific key name or value
    expect(screen.getByText('entire-configmap')).toBeInTheDocument();
    expect(screen.getByTestId('file-code-icon')).toBeInTheDocument();

    // Verify configmap routing
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
        params: {
          name: 'entire-configmap',
          namespace: 'default',
        },
        'data-cy': 'configmap-link-entire-configmap',
      })
    );
  });

  it('should render envFrom secret (entire secret import)', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            envFrom: [
              {
                secretRef: {
                  name: 'entire-secret',
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getAllByText('-')).toHaveLength(2); // EnvFrom doesn't have a specific key name or value
    expect(screen.getByText('entire-secret')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();

    // Verify secret routing
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
        params: {
          name: 'entire-secret',
          namespace: 'default',
        },
        'data-cy': 'configmap-link-entire-secret',
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
            env: [
              {
                name: 'MAIN_VAR',
                value: 'main-value',
              },
            ],
          },
        ],
        initContainers: [
          {
            name: 'init-container',
            image: 'init-image',
            env: [
              {
                name: 'INIT_VAR',
                value: 'init-value',
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    // Check main container
    expect(screen.getByText('main-container')).toBeInTheDocument();
    expect(screen.getByText('MAIN_VAR')).toBeInTheDocument();
    expect(screen.getByText('main-value')).toBeInTheDocument();

    // Check init container
    expect(screen.getByText('init-container')).toBeInTheDocument();
    expect(screen.getByText('INIT_VAR')).toBeInTheDocument();
    expect(screen.getByText('init-value')).toBeInTheDocument();
    expect(screen.getByText('init container')).toBeInTheDocument();
    expect(screen.getByTestId('asterisk-icon')).toBeInTheDocument();
  });

  it('should handle mixed environment variable types correctly', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: 'REGULAR_VAR',
                value: 'regular-value',
              },
              {
                name: 'CONFIG_VAR',
                valueFrom: {
                  configMapKeyRef: {
                    name: 'test-configmap',
                    key: 'config-key',
                  },
                },
              },
              {
                name: 'SECRET_VAR',
                valueFrom: {
                  secretKeyRef: {
                    name: 'test-secret',
                    key: 'secret-key',
                  },
                },
              },
            ],
            envFrom: [
              {
                configMapRef: {
                  name: 'entire-configmap',
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getAllByText('test-container')).toHaveLength(4); // Should appear 4 times - once for each env var
    expect(screen.getByText('REGULAR_VAR')).toBeInTheDocument();
    expect(screen.getByText('regular-value')).toBeInTheDocument();
    expect(screen.getAllByText('CONFIG_VAR')).toHaveLength(2); // Appears in name and value columns
    // Note: config-key is not displayed in UI - the component shows the env var name
    expect(screen.getAllByText('SECRET_VAR')).toHaveLength(2); // Appears in name and value columns
    // Note: secret-key is not displayed in UI - the component shows the env var name
    expect(screen.getByText('test-configmap')).toBeInTheDocument();
    expect(screen.getByText('test-secret')).toBeInTheDocument();
    expect(screen.getByText('entire-configmap')).toBeInTheDocument();

    // Should have made multiple Link calls
    expect(mockLink).toHaveBeenCalledTimes(3);

    // Verify different routing calls
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
      })
    );

    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
      })
    );
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
                env: [
                  {
                    name: 'ENV_VAR',
                    value: 'test-value',
                  },
                ],
              },
            ],
          },
        },
      },
      kind: 'Deployment',
      apiVersion: 'apps/v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('ENV_VAR')).toBeInTheDocument();
    expect(screen.getByText('test-value')).toBeInTheDocument();
  });

  it('should handle missing resource names gracefully', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: 'CONFIG_VAR',
                valueFrom: {
                  configMapKeyRef: {
                    // name is undefined
                    key: 'config-key',
                  },
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getAllByText('CONFIG_VAR')).toHaveLength(2); // Appears in name and value columns
    // Note: config-key is not displayed in UI - the component shows the env var name

    // Should show dash for missing resource name
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('should handle containers without environment variables', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            // No env or envFrom
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(
      screen.getByText('Environment variables, ConfigMaps or Secrets')
    ).toBeInTheDocument();
    expect(screen.getByTestId('text-tip')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This application is not using any environment variable, ConfigMap or Secret.'
      )
    ).toBeInTheDocument();
  });

  it('should handle environment variables without keys', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'test-container',
            image: 'test-image',
            env: [
              {
                name: '', // Empty name to test this edge case
                value: 'test-value',
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('test-container')).toBeInTheDocument();
    expect(screen.getByText('test-value')).toBeInTheDocument();

    // Should show dash for missing env var name
    const dashElements = screen.getAllByText('-');
    expect(dashElements.length).toBeGreaterThan(0);
  });

  it('should render multiple containers with different environment variable types', () => {
    const app: Application = {
      metadata: { name: 'test-pod', namespace: 'default' },
      spec: {
        containers: [
          {
            name: 'container-1',
            image: 'image-1',
            env: [
              {
                name: 'CONFIG_VAR',
                valueFrom: {
                  configMapKeyRef: {
                    name: 'shared-config',
                    key: 'config-key',
                  },
                },
              },
            ],
          },
          {
            name: 'container-2',
            image: 'image-2',
            env: [
              {
                name: 'SECRET_VAR',
                valueFrom: {
                  secretKeyRef: {
                    name: 'shared-config', // Same name but different type
                    key: 'secret-key',
                  },
                },
              },
            ],
          },
        ],
      },
      kind: 'Pod',
      apiVersion: 'v1',
    };

    render(<ApplicationEnvVarsTable namespace="default" app={app} />);

    expect(screen.getByText('container-1')).toBeInTheDocument();
    expect(screen.getByText('container-2')).toBeInTheDocument();
    expect(screen.getAllByText('CONFIG_VAR')).toHaveLength(2); // Appears in name and value columns
    expect(screen.getAllByText('SECRET_VAR')).toHaveLength(2); // Appears in name and value columns
    expect(screen.getAllByText('shared-config')).toHaveLength(2);

    // Should have made two Link calls - one for configmap, one for secret
    expect(mockLink).toHaveBeenCalledTimes(2);

    // Verify configmap routing
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.configmaps.configmap',
        params: {
          name: 'shared-config',
          namespace: 'default',
        },
      })
    );

    // Verify secret routing
    expect(mockLink).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'kubernetes.secrets.secret',
        params: {
          name: 'shared-config',
          namespace: 'default',
        },
      })
    );
  });
});
