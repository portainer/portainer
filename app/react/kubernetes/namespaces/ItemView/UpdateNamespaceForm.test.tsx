import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { UserViewModel } from '@/portainer/models/user';
import { server } from '@/setup-tests/server';

import { UpdateNamespaceForm } from './UpdateNamespaceForm';

const NAMESPACE_NAME = 'test-ns';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { id: NAMESPACE_NAME },
  })),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: vi.fn(() => 1),
}));

const mockRegistries = [
  {
    Id: 1,
    Type: 6,
    Name: 'DockerHub',
    URL: 'docker.io',
    BaseURL: '',
    Authentication: true,
    Username: 'portainer',
    Password: '',
    RegistryAccesses: {
      '1': {
        UserAccessPolicies: null,
        TeamAccessPolicies: null,
        Namespaces: [NAMESPACE_NAME],
      },
    },
    Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
    Quay: { OrganisationName: '', UseOrganisation: false },
    Ecr: { Region: '' },
    Github: { UseOrganisation: false, OrganisationName: '' },
  },
  {
    Id: 2,
    Type: 3,
    Name: 'Private Registry',
    URL: 'registry.example.com',
    BaseURL: '',
    Authentication: false,
    Username: '',
    Password: '',
    RegistryAccesses: {
      '1': {
        UserAccessPolicies: null,
        TeamAccessPolicies: null,
        Namespaces: [],
      },
    },
    Gitlab: { ProjectId: 0, InstanceURL: '', ProjectPath: '' },
    Quay: { OrganisationName: '', UseOrganisation: false },
    Ecr: { Region: '' },
    Github: { UseOrganisation: false, OrganisationName: '' },
  },
];

const mockNamespace = {
  Id: NAMESPACE_NAME,
  Name: NAMESPACE_NAME,
  Status: { phase: 'Active' },
  Annotations: {},
  CreationDate: '2024-01-01T00:00:00Z',
  NamespaceOwner: 'admin',
  IsSystem: false,
  IsDefault: false,
  UnhealthyEventCount: 0,
  ResourceQuota: {
    spec: {
      hard: {
        'requests.memory': '256Mi',
        'requests.cpu': '500m',
      },
    },
  },
};

function buildEndpointResponse(overrides: Record<string, unknown> = {}) {
  return {
    Id: 1,
    Name: 'test-cluster',
    Type: 5,
    Kubernetes: {
      Configuration: {
        EnableResourceOverCommit: false,
        StorageClasses: [],
        UseLoadBalancer: false,
        IngressAvailabilityPerNamespace: false,
      },
    },
    ...overrides,
  };
}

function setupDefaultHandlers(
  overrides: {
    endpoint?: Record<string, unknown>;
    namespace?: Record<string, unknown>;
    registries?: unknown[];
    namespaceError?: boolean;
  } = {}
) {
  const handlers = [
    http.get('/api/endpoints/:id', () =>
      HttpResponse.json(buildEndpointResponse(overrides.endpoint))
    ),
    http.get('/api/kubernetes/:id/max_resource_limits', () =>
      HttpResponse.json({ Memory: 1024, CPU: 4 })
    ),
    http.get('/api/kubernetes/:id/namespaces', () =>
      // Return other namespaces only (not the current one) so that the
      // name uniqueness validation doesn't trigger on mount.
      HttpResponse.json({
        'other-ns': { ...mockNamespace, Name: 'other-ns', Id: 'other-ns' },
      })
    ),
    http.get('/api/kubernetes/:id/namespaces/:namespace', () => {
      if (overrides.namespaceError) {
        return HttpResponse.json({ message: 'server error' }, { status: 500 });
      }
      return HttpResponse.json({
        ...mockNamespace,
        ...overrides.namespace,
      });
    }),
    http.get('/api/endpoints/:id/registries', () =>
      HttpResponse.json(overrides.registries ?? mockRegistries)
    ),
    http.get('/api/kubernetes/:id/ingresscontrollers', () =>
      HttpResponse.json([])
    ),
    // Mutation handlers
    http.put('/api/endpoints/:id/registries/:registryId', () =>
      HttpResponse.json({})
    ),
    http.put(
      '/api/kubernetes/:id/namespaces/:namespace/ingresscontrollers',
      () => HttpResponse.json([])
    ),
  ];
  server.use(...handlers);
}

function renderComponent() {
  const user = new UserViewModel({ Username: 'user', Role: 1 });

  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(UpdateNamespaceForm), user)
  );

  return render(<Wrapped />);
}

describe('UpdateNamespaceForm', () => {
  describe('form rendering', () => {
    it('should load without errors, show read-only name, registries, and disabled button', async () => {
      setupDefaultHandlers();
      renderComponent();

      // Wait for the form to load
      await waitFor(() => {
        expect(screen.getByText(NAMESPACE_NAME)).toBeVisible();
      });

      // No validation errors on initial load
      const errors = screen.queryAllByRole('alert');
      expect(errors).toHaveLength(0);

      // In edit mode, name is text not an input
      expect(
        screen.queryByPlaceholderText('e.g. my-namespace')
      ).not.toBeInTheDocument();

      // DockerHub should be shown as a selected registry (it has namespace access)
      expect(screen.getByText('Registries')).toBeVisible();
      expect(screen.getByText('DockerHub')).toBeVisible();

      // Update button is disabled when form is pristine
      expect(
        screen.getByRole('button', { name: /Update namespace/i })
      ).toBeDisabled();
    });
  });

  describe('error states', () => {
    it('should show error alert when namespace query fails', async () => {
      setupDefaultHandlers({ namespaceError: true });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Error loading namespace')).toBeVisible();
      });
    });
  });

  describe('form submission', { timeout: 10_000 }, () => {
    it('should submit correct namespace payload on update', async () => {
      setupDefaultHandlers();

      let namespacePutBody: unknown;
      server.use(
        http.put(
          '/api/kubernetes/:id/namespaces/:namespace',
          async ({ request }: { request: Request }) => {
            namespacePutBody = await request.json();
            return HttpResponse.json({});
          }
        )
      );

      const user = userEvent.setup();

      renderComponent();

      // Wait for form to be fully loaded with registries selector
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /Update namespace/i })
        ).toBeVisible();
      });

      // Dirty the form by selecting an additional registry via react-select
      const registryInput = screen.getByRole('combobox');
      await user.click(registryInput);
      // Select the second registry that isn't already selected
      await waitFor(() => {
        expect(screen.getByText('Private Registry')).toBeVisible();
      });
      await user.click(screen.getByText('Private Registry'));

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /Update namespace/i,
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(namespacePutBody).toBeDefined();
        expect(namespacePutBody).toMatchObject({
          Name: NAMESPACE_NAME,
          Owner: 'user',
        });
      });
    });
  });
});
