import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { http, HttpResponse, DefaultBodyType } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import { suppressConsoleLogs } from '@/setup-tests/suppress-console';

import { CreateGroupView } from './CreateGroupView';

vi.mock('@/react/hooks/useCanExit', () => ({
  useCanExit: vi.fn(),
}));

vi.mock('@/portainer/services/notifications', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

function renderCreateGroupView({
  onMutationError,
  availableEnvironments = [] as ReturnType<typeof createMockEnvironment>[],
}: {
  onMutationError?(): void;
  availableEnvironments?: ReturnType<typeof createMockEnvironment>[];
} = {}) {
  // Set up default mocks
  server.use(
    http.get('/api/tags', () =>
      HttpResponse.json([
        { ID: 1, Name: 'production' },
        { ID: 2, Name: 'staging' },
      ])
    ),
    http.get('/api/endpoints', ({ request }) => {
      const url = new URL(request.url);
      const groupIds = [
        ...url.searchParams.getAll('groupIds'),
        ...url.searchParams.getAll('groupIds[]'),
      ];
      if (groupIds.includes('1') && availableEnvironments.length > 0) {
        return HttpResponse.json(availableEnvironments, {
          headers: {
            'x-total-count': String(availableEnvironments.length),
            'x-total-available': String(availableEnvironments.length),
          },
        });
      }
      return HttpResponse.json([], {
        headers: { 'x-total-count': '0', 'x-total-available': '0' },
      });
    })
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(CreateGroupView)),
    { onMutationError }
  );

  return render(<Wrapped />);
}

describe('CreateGroupView', () => {
  describe('Page rendering', () => {
    it('should render the page header with correct title', async () => {
      renderCreateGroupView();

      // Use heading role to get the h1 title specifically (not the breadcrumb)
      expect(
        await screen.findByRole('heading', { name: /Create group/i })
      ).toBeVisible();
    });

    it('should render breadcrumbs with link to Groups', async () => {
      renderCreateGroupView();

      // Use the data-cy attribute to find the breadcrumb link
      expect(await screen.findByTestId('breadcrumb-Groups')).toBeVisible();
    });

    it('should render the form', async () => {
      renderCreateGroupView();

      expect(await screen.findByLabelText(/Name/i)).toBeVisible();
      expect(screen.getByLabelText(/Description/i)).toBeVisible();
    });

    it('should render the Create button', async () => {
      renderCreateGroupView();

      expect(
        await screen.findByRole('button', { name: /Create/i })
      ).toBeVisible();
    });
  });

  describe('Form submission and payload validation', () => {
    it('should submit the correct API payload with all fields', async () => {
      let requestBody: DefaultBodyType;

      server.use(
        http.post('/api/endpoint_groups', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            Id: 1,
            Name: 'test-group',
            Description: 'Test description',
            TagIds: [],
            Policies: [],
          });
        })
      );

      const user = userEvent.setup();
      renderCreateGroupView();

      // Fill in the name
      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      // Fill in the description
      const descriptionInput = screen.getByLabelText(/Description/i);
      await user.type(descriptionInput, 'Test description');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Verify the request body matches expected API payload
      await waitFor(() => {
        expect(requestBody).toEqual({
          Name: 'test-group',
          Description: 'Test description',
          TagIDs: [],
          AssociatedEndpoints: [],
        });
      });
    });

    it('should submit the correct API payload with minimal fields (name only)', async () => {
      let requestBody: DefaultBodyType;

      server.use(
        http.post('/api/endpoint_groups', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            Id: 1,
            Name: 'minimal-group',
            Description: '',
            TagIds: [],
            Policies: [],
          });
        })
      );

      const user = userEvent.setup();
      renderCreateGroupView();

      // Fill in only the name (required)
      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'minimal-group');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Verify the request body
      await waitFor(() => {
        expect(requestBody).toEqual({
          Name: 'minimal-group',
          Description: '',
          TagIDs: [],
          AssociatedEndpoints: [],
        });
      });
    });

    it('should show Creating... loading state during submission', async () => {
      server.use(
        http.post('/api/endpoint_groups', async () => {
          // Delay response to test loading state
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return HttpResponse.json({
            Id: 1,
            Name: 'test-group',
            Description: '',
            TagIds: [],
            Policies: [],
          });
        })
      );

      const user = userEvent.setup();
      renderCreateGroupView();

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      const submitButton = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });

      await user.click(submitButton);

      // Should show loading state
      expect(
        await screen.findByRole('button', { name: /Creating.../i })
      ).toBeVisible();
    });
  });

  describe('Error handling', () => {
    it('should handle API error gracefully', async () => {
      const restoreConsole = suppressConsoleLogs();

      const mutationError = vi.fn();
      const errorMessage = 'Failed to create group';

      server.use(
        http.post('/api/endpoint_groups', () =>
          HttpResponse.json({ message: errorMessage }, { status: 500 })
        )
      );

      const user = userEvent.setup();
      renderCreateGroupView({ onMutationError: mutationError });

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      const submitButton = screen.getByRole('button', { name: /Create/i });
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

  describe('Validation', () => {
    it('should show validation error for empty name', async () => {
      renderCreateGroupView();

      await waitFor(() => {
        expect(screen.getAllByText(/Name is required/i)[0]).toBeVisible();
      });
    });

    it('should disable submit button when name is empty', async () => {
      renderCreateGroupView();

      const submitButton = await screen.findByRole('button', {
        name: /Create/i,
      });

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Environment selection via drawer', () => {
    it('should include environments selected in the drawer in the POST payload', async () => {
      let requestBody: DefaultBodyType;
      const env = createMockEnvironment({ Id: 42, Name: 'my-test-env' });

      server.use(
        http.post('/api/endpoint_groups', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            Id: 1,
            Name: 'test-group',
            TagIds: [],
            Policies: [],
          });
        })
      );

      const user = userEvent.setup();
      renderCreateGroupView({ availableEnvironments: [env] });

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      // Open the add environments drawer
      const addBtn = await screen.findByTestId('add-environments-button');
      await user.click(addBtn);

      // Wait for the environment to appear in the drawer, then select via checkbox
      await screen.findByText('my-test-env');
      const drawerTable = screen.getByTestId('add-environments-drawer-table');
      const drawerCheckboxes = within(drawerTable).getAllByRole('checkbox');
      await user.click(drawerCheckboxes[1]); // [0] = select-all header, [1] = first row

      // Confirm the selection
      const confirmBtn = screen.getByTestId('add-environments-confirm-button');
      await waitFor(() => expect(confirmBtn).toBeEnabled());
      await user.click(confirmBtn);

      // Submit the form
      const submitBtn = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => expect(submitBtn).toBeEnabled());
      await user.click(submitBtn);

      await waitFor(() => {
        expect(requestBody).toMatchObject({
          Name: 'test-group',
          AssociatedEndpoints: [42],
        });
      });
    });

    it('should allow removing a selected environment before submitting', async () => {
      let requestBody: DefaultBodyType;
      const env = createMockEnvironment({ Id: 42, Name: 'removable-env' });

      server.use(
        http.post('/api/endpoint_groups', async ({ request }) => {
          requestBody = await request.json();
          return HttpResponse.json({
            Id: 1,
            Name: 'test-group',
            TagIds: [],
            Policies: [],
          });
        })
      );

      const user = userEvent.setup();
      renderCreateGroupView({ availableEnvironments: [env] });

      const nameInput = await screen.findByLabelText(/Name/i);
      await user.type(nameInput, 'test-group');

      // Add the environment via drawer
      const addBtn = await screen.findByTestId('add-environments-button');
      await user.click(addBtn);
      await screen.findByText('removable-env');
      const drawerTable = screen.getByTestId('add-environments-drawer-table');
      const drawerCheckboxes = within(drawerTable).getAllByRole('checkbox');
      await user.click(drawerCheckboxes[1]);
      const confirmBtn = screen.getByTestId('add-environments-confirm-button');
      await waitFor(() => expect(confirmBtn).toBeEnabled());
      await user.click(confirmBtn);

      // Environment now appears in the associated list — select its row checkbox and remove it
      await screen.findByText('removable-env');
      const assocTable = screen.getByTestId('group-associatedEndpoints');
      const assocCheckboxes = within(assocTable).getAllByRole('checkbox');
      await user.click(assocCheckboxes[assocCheckboxes.length - 1]);
      const removeBtn = await screen.findByTestId('remove-environments-button');
      await waitFor(() => expect(removeBtn).toBeEnabled());
      await user.click(removeBtn);

      // Submit — payload should have no environments
      const submitBtn = screen.getByRole('button', { name: /Create/i });
      await waitFor(() => expect(submitBtn).toBeEnabled());
      await user.click(submitBtn);

      await waitFor(() => {
        expect(requestBody).toMatchObject({
          Name: 'test-group',
          AssociatedEndpoints: [],
        });
      });
    });
  });
});
