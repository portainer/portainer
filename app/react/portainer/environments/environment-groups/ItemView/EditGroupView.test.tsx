import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse, DefaultBodyType } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
import {
  Environment,
  EnvironmentType,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';

import { EnvironmentGroup } from '../types';

import { EditGroupView } from './EditGroupView';

vi.mock('@/react/hooks/useCanExit', () => ({
  useCanExit: vi.fn(),
}));

vi.mock('@/react/hooks/useIdParam', () => ({
  useIdParam: () => 2, // Default to group ID 2 for most tests
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

const mockGroup: EnvironmentGroup = {
  Id: 2,
  Name: 'Test Group',
  Description: 'Test description',
  TagIds: [1],
};

const mockEnvironment: Partial<Environment> = {
  Id: 1,
  Name: 'Test Environment',
  Type: EnvironmentType.Docker,
  Status: EnvironmentStatus.Up,
  GroupId: 2,
  TagIds: [],
};

function buildMockEnvironment(
  id: number,
  name: string,
  groupId: number = 1
): Partial<Environment> {
  return {
    Id: id,
    Name: name,
    Type: EnvironmentType.Docker,
    Status: EnvironmentStatus.Up,
    GroupId: groupId,
    TagIds: [],
  };
}

function renderEditGroupView({
  onMutationError,
  groupData = mockGroup,
  associatedEnvironments = [mockEnvironment],
}: {
  onMutationError?(): void;
  groupData?: EnvironmentGroup | null;
  associatedEnvironments?: Array<Partial<Environment>>;
} = {}) {
  // Set up default mocks
  server.use(
    http.get('/api/tags', () =>
      HttpResponse.json([
        { ID: 1, Name: 'production' },
        { ID: 2, Name: 'staging' },
      ])
    ),
    http.get<object, never, EnvironmentGroup | { message: string }>(
      '/api/endpoint_groups/2',
      () => {
        if (groupData === null) {
          return HttpResponse.json(
            { message: 'Group not found' },
            { status: 404 }
          );
        }
        return HttpResponse.json(groupData);
      }
    ),
    // Mock for environments query (associated environments)
    http.get('/api/endpoints', ({ request }) => {
      const url = new URL(request.url);
      // Get all groupIds values (handles both groupIds=2 and groupIds[]=2 formats)
      const groupIdsParam = url.searchParams.getAll('groupIds');
      const groupIds =
        groupIdsParam.length > 0
          ? groupIdsParam
          : url.searchParams.getAll('groupIds[]');
      const endpointIdsParam = url.searchParams.getAll('endpointIds');
      const endpointIds =
        endpointIdsParam.length > 0
          ? endpointIdsParam
          : url.searchParams.getAll('endpointIds[]');

      // Helper to create response with required headers
      function createResponse(envs: Array<Partial<Environment>>) {
        return HttpResponse.json(envs, {
          headers: {
            'x-total-count': String(envs.length),
            'x-total-available': String(envs.length),
          },
        });
      }

      // If querying by endpointIds (AssociatedEnvironmentsSelector initial query)
      if (endpointIds.length > 0) {
        const ids = endpointIds.map(Number);
        const envs = associatedEnvironments.filter((e) =>
          ids.includes(e.Id as number)
        );
        return createResponse(envs);
      }

      // If querying for group's associated environments
      if (groupIds.includes('2')) {
        return createResponse(associatedEnvironments);
      }
      // For available environments (unassigned group = 1)
      if (groupIds.includes('1')) {
        return createResponse([
          buildMockEnvironment(10, 'Available Env 1'),
          buildMockEnvironment(11, 'Available Env 2'),
        ]);
      }
      return createResponse([]);
    })
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EditGroupView)),
    { onMutationError }
  );

  return render(<Wrapped />);
}

describe('EditGroupView', () => {
  describe('Page rendering', () => {
    it('should render the page header with correct title', async () => {
      renderEditGroupView();

      expect(
        await screen.findByText('Environment group details')
      ).toBeVisible();
    });

    it('should render breadcrumbs with link to Groups', async () => {
      renderEditGroupView();

      expect(await screen.findByText('Groups')).toBeVisible();
    });

    it('should render group name in breadcrumbs after loading', async () => {
      renderEditGroupView();

      expect(await screen.findByText('Test Group')).toBeVisible();
    });

    it('should render the Update button', async () => {
      renderEditGroupView();

      expect(
        await screen.findByRole('button', { name: /Update/i })
      ).toBeVisible();
    });
  });

  describe('Loading state', () => {
    it('should not show form while fetching group data', async () => {
      server.use(
        http.get('/api/endpoint_groups/2', async () => {
          // Delay response to test loading state
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return HttpResponse.json(mockGroup);
        })
      );

      renderEditGroupView();

      // Form should not be visible initially while loading
      expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();

      // After loading completes, form should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/Name/i)).toBeVisible();
      });
    });

    it('should populate form with fetched group data', async () => {
      renderEditGroupView();

      // Wait for data to load and populate the form
      const nameInput = await screen.findByLabelText(/Name/i);
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test Group');
      });

      const descriptionInput = screen.getByLabelText(/Description/i);
      expect(descriptionInput).toHaveValue('Test description');
    });

    it('should show Associated environments section for non-unassigned groups', async () => {
      renderEditGroupView();

      // Wait for form to load
      await screen.findByLabelText(/Name/i);

      // Check that at least one "Associated environments" text exists (section + table title)
      const elements = screen.getAllByText(/Associated environments/i);
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeVisible();
    });
  });

  describe('Error state', () => {
    // Suppress console logs for error state tests
    const restoreConsole = suppressConsoleLogs();
    afterAll(restoreConsole);

    it('should show error Alert when group fetch fails', async () => {
      renderEditGroupView({ groupData: null });

      // Should show the error message
      expect(
        await screen.findByText(/Failed to load group details/i)
      ).toBeVisible();
    });

    it('should show error alert with Error title', async () => {
      renderEditGroupView({ groupData: null });

      // Wait for the error alert to appear by finding the error message
      await screen.findByText(/Failed to load group details/i);

      // Check that the Error title is shown
      expect(screen.getByText('Error')).toBeVisible();
    });

    it('should NOT show the form when group fetch fails', async () => {
      renderEditGroupView({ groupData: null });

      // Wait for the error message to appear
      await screen.findByText(/Failed to load group details/i);

      // Form fields should not be visible
      expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Update/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Form submission and payload validation', () => {
    it('should submit the correct API payload when updating', async () => {
      let requestBody: DefaultBodyType;
      let requestUrl: string;

      server.use(
        http.put('/api/endpoint_groups/:id', async ({ request, params }) => {
          requestBody = await request.json();
          requestUrl = `/api/endpoint_groups/${params.id}`;
          return HttpResponse.json({
            ...mockGroup,
            Name: 'Updated Group',
          });
        })
      );

      const user = userEvent.setup();
      renderEditGroupView();

      // Wait for form to populate
      const nameInput = await screen.findByLabelText(/Name/i);
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test Group');
      });

      // Clear and update the name
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Group');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Update/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Verify the request URL and body.
      await waitFor(() => {
        expect(requestUrl).toBe('/api/endpoint_groups/2');
        expect(requestBody).toEqual({
          Name: 'Updated Group',
          Description: 'Test description',
          TagIDs: [1],
        });
      });
    });

    it('should submit updated description correctly', async () => {
      let requestBody: DefaultBodyType;

      server.use(
        http.put('/api/endpoint_groups/:id', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            ...mockGroup,
            Description: 'New description',
          });
        })
      );

      const user = userEvent.setup();
      renderEditGroupView();

      // Wait for form to populate
      const descriptionInput = await screen.findByLabelText(/Description/i);
      await waitFor(() => {
        expect(descriptionInput).toHaveValue('Test description');
      });

      // Clear and update the description
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'New description');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Update/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Verify the request body includes new description
      await waitFor(() => {
        expect(requestBody).toMatchObject({
          Description: 'New description',
        });
      });
    });

    it('should show Updating... loading state during submission', async () => {
      server.use(
        http.put('/api/endpoint_groups/:id', async () => {
          // Delay response to test loading state
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return HttpResponse.json(mockGroup);
        })
      );

      const user = userEvent.setup();
      renderEditGroupView();

      // Wait for form to populate
      const nameInput = await screen.findByLabelText(/Name/i);
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test Group');
      });

      // Make a change to enable the submit button
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');

      const submitButton = screen.getByRole('button', { name: /Update/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Should show loading state
      expect(
        await screen.findByRole('button', { name: /Updating.../i })
      ).toBeVisible();
    });
  });

  describe('Error handling on update', () => {
    it('should handle API error gracefully on update', async () => {
      const restoreConsole = suppressConsoleLogs();

      const mutationError = vi.fn();
      const errorMessage = 'Failed to update group';

      server.use(
        http.put('/api/endpoint_groups/:id', () =>
          HttpResponse.json({ message: errorMessage }, { status: 500 })
        )
      );

      const user = userEvent.setup();
      renderEditGroupView({ onMutationError: mutationError });

      // Wait for form to populate
      const nameInput = await screen.findByLabelText(/Name/i);
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test Group');
      });

      // Make a change
      await user.clear(nameInput);
      await user.type(nameInput, 'Changed Name');

      const submitButton = screen.getByRole('button', { name: /Update/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      await waitFor(() => {
        expect(mutationError).toHaveBeenCalled();
      });

      restoreConsole();
    });
  });

  describe('Associated environments', () => {
    it('should display initially associated environments', async () => {
      renderEditGroupView({
        associatedEnvironments: [
          { ...mockEnvironment, Id: 1, Name: 'Env 1' } as Partial<Environment>,
          { ...mockEnvironment, Id: 2, Name: 'Env 2' } as Partial<Environment>,
        ],
      });

      // Wait for the form to load
      await screen.findByLabelText(/Name/i);

      // Check that at least one "Associated environments" text exists (section + table title)
      const elements = screen.getAllByText(/Associated environments/i);
      expect(elements.length).toBeGreaterThan(0);
      expect(elements[0]).toBeVisible();
    });

    it('should NOT include AssociatedEndpoints in update payload (backend preserves associations)', async () => {
      let requestBody: DefaultBodyType;

      server.use(
        http.put('/api/endpoint_groups/:id', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json(mockGroup);
        })
      );

      const user = userEvent.setup();
      renderEditGroupView();

      // Wait for form to populate
      const nameInput = await screen.findByLabelText(/Name/i);
      await waitFor(() => {
        expect(nameInput).toHaveValue('Test Group');
      });

      // Make a small change to enable submit
      await user.type(nameInput, ' edited');

      const submitButton = screen.getByRole('button', { name: /Update/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Verify AssociatedEndpoints is absent — backend nil-check preserves existing memberships
      await waitFor(() => {
        expect(requestBody).not.toHaveProperty('AssociatedEndpoints');
      });
    });
  });
});
