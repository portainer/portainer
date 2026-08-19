import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useIsPureAdmin, useIsEnvironmentAdmin } from '@/react/hooks/useUser';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useDebouncedValue } from '@/react/hooks/useDebouncedValue';
import { useRegistries } from '@/react/portainer/registries/queries/useRegistries';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';

import {
  getFirstNamespaceFromManifest,
  hasNonDefaultServiceAccount,
  K8sRegistryAccessNotice,
} from './K8sRegistryAccessNotice';

vi.mock('@/react/hooks/useUser');
vi.mock('@/react/hooks/useEnvironmentId');
vi.mock('@/react/hooks/useDebouncedValue');
vi.mock('@/react/portainer/registries/queries/useRegistries');
vi.mock('@/react/portainer/environments/queries/useEnvironmentRegistries');
vi.mock('@@/Tip/TextTip', () => ({
  TextTip: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div role="note" className={className}>
      {children}
    </div>
  ),
}));
vi.mock('@@/Tip/TooltipWithChildren', () => ({
  TooltipWithChildren: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('@@/Link', () => ({
  Link: ({
    children,
    'data-cy': dataCy,
  }: {
    children: React.ReactNode;
    'data-cy'?: string;
  }) => (
    <a href="." data-cy={dataCy}>
      {children}
    </a>
  ),
}));
vi.mock('@@/InlineLoader', () => ({
  InlineLoader: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

const mockUseIsPureAdmin = vi.mocked(useIsPureAdmin);
const mockUseIsEnvironmentAdmin = vi.mocked(useIsEnvironmentAdmin);
const mockUseEnvironmentId = vi.mocked(useEnvironmentId);
const mockUseDebouncedValue = vi.mocked(useDebouncedValue);
const mockUseRegistries = vi.mocked(useRegistries);
const mockUseEnvironmentRegistries = vi.mocked(useEnvironmentRegistries);

type MockRegistry = { Id: number; Name: string; URL: string };

function setupMocks({
  isPureAdmin = false,
  isEnvAdmin = false,
  isEnvAdminLoading = false,
  environmentIdFromRoute = 1,
  allRegistries = [] as MockRegistry[],
  allRegistriesLoading = false,
  nsRegistries = [] as MockRegistry[],
  nsRegistriesLoading = false,
} = {}) {
  mockUseIsPureAdmin.mockReturnValue(isPureAdmin);
  mockUseIsEnvironmentAdmin.mockReturnValue({
    authorized: isEnvAdmin,
    isLoading: isEnvAdminLoading,
  });
  mockUseEnvironmentId.mockReturnValue(environmentIdFromRoute);
  mockUseDebouncedValue.mockImplementation((v) => v);
  mockUseRegistries.mockReturnValue({
    data: allRegistries,
    isLoading: allRegistriesLoading,
  } as unknown as ReturnType<typeof useRegistries>);
  mockUseEnvironmentRegistries.mockReturnValue({
    data: nsRegistries,
    isLoading: nsRegistriesLoading,
  } as unknown as ReturnType<typeof useEnvironmentRegistries>);
}

describe('K8sRegistryAccessNotice', () => {
  beforeEach(() => {
    setupMocks();
  });

  describe('renders nothing', () => {
    it('when namespace is not provided or determinable from manifest', () => {
      const { container } = render(<K8sRegistryAccessNotice />);
      expect(container).toBeEmptyDOMElement();
    });

    it('when environmentId cannot be determined from route or prop', () => {
      mockUseEnvironmentId.mockReturnValue(0);
      const { container } = render(
        <K8sRegistryAccessNotice namespace="my-ns" />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('renders an invisible placeholder while loading to prevent layout shift', () => {
    setupMocks({ nsRegistriesLoading: true });
    render(<K8sRegistryAccessNotice namespace="my-ns" />);
    expect(screen.getByRole('note')).toHaveClass('invisible');
  });

  describe('no registries configured at all', () => {
    it('shows add-registry and setup-access links for pure admins', () => {
      setupMocks({ isPureAdmin: true });
      render(<K8sRegistryAccessNotice namespace="my-ns" environmentId={2} />);
      expect(screen.getByText(/no registries configured/i)).toBeVisible();
      expect(screen.getByTestId('add-registry-link')).toBeVisible();
      expect(screen.getByTestId('setup-registry-access-link')).toBeVisible();
    });

    it('shows a contact-admin message for non-admins', () => {
      setupMocks({ isPureAdmin: false });
      render(<K8sRegistryAccessNotice namespace="my-ns" />);
      expect(screen.getByText(/no registries configured/i)).toBeVisible();
      expect(
        screen.getByText(/contact your portainer administrator/i)
      ).toBeVisible();
    });
  });

  describe('namespace has no registry access', () => {
    it('shows a setup link for environment admins', () => {
      setupMocks({
        isEnvAdmin: true,
        allRegistries: [
          { Id: 1, Name: 'Global Registry', URL: 'registry.example.com' },
        ],
      });
      render(<K8sRegistryAccessNotice namespace="my-ns" environmentId={2} />);
      expect(screen.getByText(/registry access not configured/i)).toBeVisible();
      expect(screen.getByTestId('setup-registry-access-link')).toBeVisible();
    });

    it('shows a contact-admin message for regular users', () => {
      setupMocks({
        isEnvAdmin: false,
        allRegistries: [
          { Id: 1, Name: 'Global Registry', URL: 'registry.example.com' },
        ],
      });
      render(<K8sRegistryAccessNotice namespace="my-ns" />);
      expect(screen.getByText(/registry access not configured/i)).toBeVisible();
      expect(
        screen.getByText(
          /contact your portainer administrator to set up registry access/i
        )
      ).toBeVisible();
    });
  });

  describe('namespace has registry access', () => {
    const registries: MockRegistry[] = [
      { Id: 1, Name: 'Registry A', URL: 'registry-a.example.com' },
      { Id: 2, Name: 'Registry B', URL: 'registry-b.example.com' },
    ];

    it('shows the correct count (plural) of accessible registries', () => {
      setupMocks({ allRegistries: registries, nsRegistries: registries });
      render(<K8sRegistryAccessNotice namespace="my-ns" />);
      expect(screen.getByText(/2 registries/i)).toBeVisible();
    });

    it('uses singular "registry" for a single accessible registry', () => {
      setupMocks({
        allRegistries: [registries[0]],
        nsRegistries: [registries[0]],
      });
      render(<K8sRegistryAccessNotice namespace="my-ns" />);
      expect(screen.getByText(/1 registry/i)).toBeVisible();
    });

    it('always includes "will work automatically" regardless of view type', () => {
      setupMocks({
        allRegistries: [registries[0]],
        nsRegistries: [registries[0]],
      });
      render(<K8sRegistryAccessNotice namespace="my-ns" />);
      expect(screen.getByText(/will work automatically/i)).toBeVisible();
    });

    it('shows a manage-access link for environment admins', () => {
      setupMocks({
        isEnvAdmin: true,
        allRegistries: [registries[0]],
        nsRegistries: [registries[0]],
      });
      render(<K8sRegistryAccessNotice namespace="my-ns" environmentId={2} />);
      expect(screen.getByTestId('manage-registry-access-link')).toBeVisible();
    });

    it('hides the notice when a custom service account is detected in the manifest', () => {
      const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: my-ns
spec:
  template:
    spec:
      serviceAccountName: custom-sa
      containers:
        - name: app
          image: nginx
`;
      setupMocks({
        allRegistries: [registries[0]],
        nsRegistries: [registries[0]],
      });
      const { container } = render(
        <K8sRegistryAccessNotice manifestContent={manifest} />
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});

describe('getFirstNamespaceFromManifest', () => {
  it('returns the namespace from a single-document manifest', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
  namespace: my-namespace
spec:
  replicas: 1
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBe('my-namespace');
  });

  it('returns the first namespace from a multi-document manifest', () => {
    const manifest = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: config
  namespace: first-ns
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: second-ns
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBe('first-ns');
  });

  it('returns undefined when no namespace is present', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
spec:
  replicas: 1
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(getFirstNamespaceFromManifest('')).toBeUndefined();
  });

  it('skips invalid YAML documents and continues', () => {
    const manifest = `
invalid: yaml: [broken
---
apiVersion: v1
kind: Namespace
metadata:
  name: valid
  namespace: good-ns
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBe('good-ns');
  });

  it('returns undefined when manifest has only cluster-scoped resources', () => {
    const manifest = `
apiVersion: v1
kind: Namespace
metadata:
  name: my-namespace
`;
    expect(getFirstNamespaceFromManifest(manifest)).toBeUndefined();
  });
});

describe('hasNonDefaultServiceAccount', () => {
  it('returns false when no serviceAccountName is set', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  namespace: default
spec:
  template:
    spec:
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(false);
  });

  it('returns false when serviceAccountName is "default"', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      serviceAccountName: default
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(false);
  });

  it('returns true when a Deployment uses a custom serviceAccountName', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      serviceAccountName: my-service-account
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns true when a Pod uses a custom serviceAccountName', () => {
    const manifest = `
apiVersion: v1
kind: Pod
metadata:
  name: my-pod
spec:
  serviceAccountName: custom-sa
  containers:
    - name: app
      image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns true when a CronJob uses a custom serviceAccountName', () => {
    const manifest = `
apiVersion: batch/v1
kind: CronJob
metadata:
  name: my-job
spec:
  schedule: "* * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: cron-sa
          containers:
            - name: job
              image: busybox
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns true when any doc in a multi-doc manifest has a custom SA', () => {
    const manifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-a
spec:
  template:
    spec:
      containers:
        - name: a
          image: nginx
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-b
spec:
  template:
    spec:
      serviceAccountName: special-sa
      containers:
        - name: b
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(hasNonDefaultServiceAccount('')).toBe(false);
  });

  it('skips invalid YAML and returns false when no valid custom SA found', () => {
    const manifest = `
invalid: yaml: [broken
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
spec:
  template:
    spec:
      containers:
        - name: app
          image: nginx
`;
    expect(hasNonDefaultServiceAccount(manifest)).toBe(false);
  });
});
