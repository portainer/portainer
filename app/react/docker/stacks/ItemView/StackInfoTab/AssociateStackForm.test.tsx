import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { server } from '@/setup-tests/server';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { createMockUsers } from '@/react-tools/test-mocks';
import { useSwarmId } from '@/react/docker/proxy/queries/useSwarm';

import { AssociateStackForm } from './AssociateStackForm';

// Mock the useSwarmId hook to avoid React Query complexity
vi.mock('@/react/docker/proxy/queries/useSwarm', () => ({
  useSwarmId: vi.fn(),
}));

// Mock the AccessControlForm to simplify testing
vi.mock('@/react/portainer/access-control', () => ({
  AccessControlForm: vi.fn(({ onChange, values }) => (
    <div data-cy="access-control-form">
      <button
        type="button"
        onClick={() =>
          onChange({
            ...values,
            ownership: 'private',
          })
        }
      >
        Change Access Control
      </button>
    </div>
  )),
}));

beforeEach(() => {
  vi.mocked(useSwarmId).mockReturnValue({
    data: undefined,
  } as ReturnType<typeof useSwarmId>);
});

afterEach(() => {
  vi.clearAllMocks();
});

it('should render correctly', () => {
  renderComponent();

  expect(screen.getByText('Associate to this environment')).toBeVisible();
  expect(
    screen.getByText(/This feature allows you to re-associate this stack/i)
  ).toBeVisible();

  expect(screen.getByTestId('access-control-form')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Associate' })).toBeVisible();
});

describe('form submission', () => {
  it('should call mutation with correct payload on submit', async () => {
    let requestUrl = '';

    server.use(
      http.put<{ id: string }>(
        '/api/stacks/:id/associate',
        async ({ request, params }) => {
          requestUrl = request.url;
          return HttpResponse.json(createMockStackResponse(params.id));
        }
      ),
      http.put('/api/resource_controls/:id', async ({ request }) => {
        await request.json();
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    renderComponent({
      environmentId: 5,
      stackId: 123,
      isOrphanedRunning: true,
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Associate' })).toBeVisible();
    });

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    await waitFor(() => {
      expect(requestUrl).toContain('endpointId=5');
      expect(requestUrl).toContain('orphanedRunning=true');
    });
  });

  it('should show loading state during submission', async () => {
    let associateCalled = false;

    server.use(
      http.put('/api/stacks/:id/associate', async () => {
        associateCalled = true;
        await delay(50);
        return HttpResponse.json(createMockStackResponse());
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent();

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    // Check for loading text
    expect(screen.getByText(/association in progress/i)).toBeVisible();

    // Wait for API call
    await waitFor(
      () => {
        expect(associateCalled).toBe(true);
      },
      { timeout: 2000 }
    );
  });

  it('should complete association successfully', async () => {
    let associateCalled = false;
    let resourceControlCalled = false;

    server.use(
      http.put('/api/stacks/:id/associate', () => {
        associateCalled = true;
        return HttpResponse.json(createMockStackResponse());
      }),
      http.put('/api/resource_controls/:id', () => {
        resourceControlCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    const user = userEvent.setup();
    renderComponent({ stackName: 'my-stack' });

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    // Verify both API calls were made
    await waitFor(
      () => {
        expect(associateCalled).toBe(true);
        expect(resourceControlCalled).toBe(true);
      },
      { timeout: 3000 }
    );
  });
});

describe('swarmId integration', () => {
  it('should pass swarmId when environment is in swarm mode', async () => {
    let requestUrl = '';

    vi.mocked(useSwarmId).mockReturnValue({
      data: 'swarm-id-123',
    } as ReturnType<typeof useSwarmId>);

    server.use(
      http.put('/api/stacks/:id/associate', async ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(createMockStackResponse());
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent({ environmentId: 1 });

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    await waitFor(() => {
      expect(requestUrl).toContain('swarmId=swarm-id-123');
    });
  });

  it('should not pass swarmId when environment is not in swarm mode', async () => {
    let requestUrl = '';

    vi.mocked(useSwarmId).mockReturnValue({
      data: undefined,
    } as ReturnType<typeof useSwarmId>);

    server.use(
      http.put('/api/stacks/:id/associate', async ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(createMockStackResponse());
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent();

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    // Verify swarmId is not included in the request
    await waitFor(() => {
      expect(requestUrl).not.toContain('swarmId');
    });
  });
});

describe('orphanedRunning parameter', () => {
  it('should pass isOrphanedRunning=true when provided', async () => {
    let requestUrl = '';

    server.use(
      http.put('/api/stacks/:id/associate', async ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(createMockStackResponse());
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent({ isOrphanedRunning: true });

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    await waitFor(() => {
      expect(requestUrl).toContain('orphanedRunning=true');
    });
  });

  it('should pass isOrphanedRunning=false when undefined', async () => {
    let requestUrl = '';

    server.use(
      http.put('/api/stacks/:id/associate', async ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(createMockStackResponse());
      }),
      http.put('/api/resource_controls/:id', () =>
        HttpResponse.json({ success: true })
      )
    );

    const user = userEvent.setup();
    renderComponent({ isOrphanedRunning: undefined });

    const associateButton = screen.getByRole('button', { name: 'Associate' });
    await user.click(associateButton);

    await waitFor(() => {
      expect(requestUrl).toContain('orphanedRunning=false');
    });
  });
});

function renderComponent({
  stackName = 'test-stack',
  environmentId = 1,
  stackId = 123,
  isOrphanedRunning,
}: Partial<React.ComponentProps<typeof AssociateStackForm>> = {}) {
  const users = createMockUsers(1, [1]);

  server.use(
    http.get('/api/users/:id', () => HttpResponse.json(users[0])),
    http.get('/api/endpoints/:id/docker/swarm', () =>
      HttpResponse.json({ message: 'Not in swarm mode' }, { status: 503 })
    )
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(AssociateStackForm))
  );

  return render(
    <Wrapped
      stackName={stackName}
      environmentId={environmentId}
      stackId={stackId}
      isOrphanedRunning={isOrphanedRunning}
    />
  );
}

function createMockStackResponse(stackId = '123') {
  return {
    Id: stackId,
    Name: 'test-stack',
    ResourceControl: {
      Id: 1,
      ResourceId: stackId,
      Type: 6,
    },
  };
}
