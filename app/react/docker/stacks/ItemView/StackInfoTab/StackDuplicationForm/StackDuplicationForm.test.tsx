import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { UIRouterContext, UIRouterReact } from '@uirouter/react';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';
import { Stack } from '@/react/common/stacks/types';
import {
  createMockEnvironment,
  createMockEnvironmentGroup,
  createMockStack,
} from '@/react-tools/test-mocks';

import { StackDuplicationForm } from './StackDuplicationForm';

it('should render Widget with title and inner component', async () => {
  const { getByText } = renderComponent();

  expect(getByText('Stack duplication / migration')).toBeVisible();
  await waitFor(() => {
    expect(
      getByText('This feature allows you to duplicate or migrate this stack.')
    ).toBeVisible();
  });
});

it('should initialize form with empty name and no selected environment', async () => {
  const { getByPlaceholderText, getByRole } = renderComponent();

  await waitFor(() => {
    expect(
      getByPlaceholderText('Stack name (optional for migration)')
    ).toHaveValue('');
    expect(getByRole('button', { name: /migrate/i })).toBeDisabled();
    expect(getByRole('button', { name: /duplicate/i })).toBeDisabled();
  });
});

it('should display rename help text', async () => {
  const { getByText } = renderComponent();

  await waitFor(() => {
    expect(
      getByText(
        'To rename the stack, choose the same environment when migrating.'
      )
    ).toBeVisible();
  });
});

function renderComponent({
  stack = createMockStack(),
  currentEnvironmentId = 1,
  yamlError,
  originalFileContent = 'version: "3"\nservices:\n  app:\n    image: nginx',
}: {
  stack?: Stack;
  currentEnvironmentId?: number;
  yamlError?: string;
  originalFileContent?: string;
} = {}) {
  const mockEnvironments = [
    createMockEnvironment({ Id: 1, Name: 'Current Environment', GroupId: 1 }),
    createMockEnvironment({ Id: 2, Name: 'Target Environment', GroupId: 1 }),
  ];

  const mockGroups: EnvironmentGroup[] = [
    createMockEnvironmentGroup({ Id: 1, Name: 'Unassigned' }),
  ];

  server.use(
    http.get('/api/endpoints', () => HttpResponse.json(mockEnvironments)),
    http.get('/api/endpoint_groups', () => HttpResponse.json(mockGroups))
  );

  const mockRouter = {
    stateService: {
      go: vi.fn(),
    },
  } as unknown as UIRouterReact;

  const Component = withTestQueryProvider(() => (
    <UIRouterContext.Provider value={mockRouter}>
      <StackDuplicationForm
        stack={stack}
        currentEnvironmentId={currentEnvironmentId}
        yamlError={yamlError}
        originalFileContent={originalFileContent}
      />
    </UIRouterContext.Provider>
  ));

  return { ...render(<Component />), mockRouter };
}
