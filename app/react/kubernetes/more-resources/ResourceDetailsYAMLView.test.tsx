import { render, screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { ReactNode } from 'react';

import { server, http } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';

import { ResourceDetailsYAMLView } from './ResourceDetailsYAMLView';

vi.mock('@@/PageHeader', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('@@/Link', () => ({
  Link: ({
    children,
    ...props
  }: {
    children: ReactNode;
    [key: string]: unknown;
  }) => <a {...props}>{children}</a>,
}));

const mockResourceConfig = {
  title: 'ConfigMap',
  breadcrumbLabel: 'ConfigMaps',
  breadcrumbLink: 'portainer.kubernetes.configmaps',
  resourceType: 'ConfigMap',
  apiVersion: 'v1',
  resourcePlural: 'configmaps',
  namespaced: true,
  yamlIdentifier: 'configmap-yaml',
  dataCy: 'k8s-configmap-yaml',
};

let mockParams: Record<string, unknown> = {
  name: 'my-cm',
  namespace: 'default',
  endpointId: 1,
  tab: 'yaml',
};

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useCurrentStateAndParams: () => ({
      state: { data: { resourceConfig: mockResourceConfig } },
      params: mockParams,
    }),
  };
});

vi.mock('../components/YAMLInspector', () => ({
  YAMLInspector: ({
    data,
    isLoading,
    isError,
    'data-cy': dataCy,
  }: {
    data: string;
    isLoading?: boolean;
    isError?: boolean;
    'data-cy'?: string;
  }) => {
    if (isLoading) {
      return <div data-cy="yaml-loading">Loading</div>;
    }
    if (isError) {
      return <div>Error loading YAML</div>;
    }
    return <pre data-cy={dataCy}>{data}</pre>;
  },
}));

vi.mock('@@/CodeEditor', () => ({
  CodeEditor: ({
    value,
    id,
    'data-cy': dataCy,
  }: {
    value?: string;
    id?: string;
    'data-cy'?: string;
  }) => (
    <div data-cy={dataCy} data-testid={id}>
      {value}
    </div>
  ),
}));

vi.mock('@/react/hooks/useEnvironmentId', () => ({
  useEnvironmentId: () => 1,
}));

function renderView() {
  const Wrapped = withTestQueryProvider(ResourceDetailsYAMLView);
  return render(<Wrapped />);
}

describe('ResourceDetailsYAMLView', () => {
  beforeEach(() => {
    server.resetHandlers();
    mockParams = {
      name: 'my-cm',
      namespace: 'default',
      endpointId: 1,
      tab: 'yaml',
    };
  });

  it('renders title and YAML from the kubernetes API on the YAML tab', async () => {
    server.use(
      http.get(
        '/api/endpoints/1/kubernetes/api/v1/namespaces/default/configmaps/my-cm',
        () =>
          new HttpResponse('kind: ConfigMap', {
            headers: { 'Content-Type': 'application/yaml' },
          })
      )
    );

    renderView();

    expect(
      screen.getByRole('heading', { name: 'ConfigMap', level: 1 })
    ).toBeVisible();

    await waitFor(() => {
      expect(screen.getByText('kind: ConfigMap')).toBeVisible();
    });
  });

  it('renders Describe output when the Describe tab is selected', async () => {
    mockParams = {
      name: 'my-cm',
      namespace: 'default',
      endpointId: 1,
      tab: 'describe',
    };

    server.use(
      http.get('/api/kubernetes/1/describe', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('name')).toBe('my-cm');
        expect(url.searchParams.get('kind')).toBe('ConfigMap');
        expect(url.searchParams.get('namespace')).toBe('default');
        return HttpResponse.json({ describe: 'Name: my-cm' });
      })
    );

    renderView();

    await waitFor(() => {
      expect(screen.getByText('Name: my-cm')).toBeVisible();
    });
    expect(screen.getByTestId('describe-resource')).toBeVisible();
  });
});
