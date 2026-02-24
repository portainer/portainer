import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { server } from '@/setup-tests/server';
import { createMockEnvironment } from '@/react-tools/test-mocks';
import {
  Environment,
  EnvironmentId,
} from '@/react/portainer/environments/types';

import { EnvironmentGroup } from '../../types';

import { AssociatedEnvironmentsSelector } from './AssociatedEnvironmentsSelector';

vi.mock('@@/modals/confirm', () => ({
  openConfirm: vi.fn().mockResolvedValue(true),
  confirmDelete: vi.fn().mockResolvedValue(true),
}));

const mockGroup: EnvironmentGroup = {
  Id: 2,
  Name: 'Test Group',
  Description: '',
  TagIds: [],
};

function createEnv(id: EnvironmentId, name: string): Partial<Environment> {
  return createMockEnvironment({ Id: id, Name: name });
}

function setupMockServer({
  associatedEnvs = [] as Array<Partial<Environment>>,
  availableEnvs = [] as Array<Partial<Environment>>,
  onPut = undefined as ((body: unknown) => void) | undefined,
} = {}) {
  server.use(
    http.get('/api/endpoint_groups/2', () => HttpResponse.json(mockGroup)),
    http.get('/api/endpoints', ({ request }) => {
      const url = new URL(request.url);
      const groupIds = [
        ...url.searchParams.getAll('groupIds'),
        ...url.searchParams.getAll('groupIds[]'),
      ];

      function makeResponse(envs: Array<Partial<Environment>>) {
        return HttpResponse.json(envs, {
          headers: {
            'x-total-count': String(envs.length),
            'x-total-available': String(envs.length),
          },
        });
      }

      if (groupIds.includes('2')) return makeResponse(associatedEnvs);
      if (groupIds.includes('1')) return makeResponse(availableEnvs);
      return makeResponse([]);
    }),
    http.put('/api/endpoint_groups/2', async ({ request }) => {
      const body = await request.json();
      onPut?.(body);
      return HttpResponse.json(mockGroup);
    })
  );
}

function renderComponent(groupId = 2) {
  const Wrapped = withTestQueryProvider(() => (
    <AssociatedEnvironmentsSelector groupId={groupId} readOnly={false} />
  ));

  return render(<Wrapped />);
}

describe('AssociatedEnvironmentsSelector', () => {
  describe('Rendering', () => {
    it('renders the associated environments table', async () => {
      setupMockServer();
      renderComponent();

      expect(
        await screen.findByRole('heading', { name: 'Associated environments' })
      ).toBeVisible();
    });

    it('renders an Add button', async () => {
      setupMockServer();
      renderComponent();

      expect(
        await screen.findByTestId('add-environments-button')
      ).toBeInTheDocument();
    });

    it('renders a Remove button that is initially disabled', async () => {
      setupMockServer({ associatedEnvs: [createEnv(10, 'my-env')] });
      renderComponent();

      await screen.findByText('my-env');

      const removeBtn = screen.getByTestId('remove-environments-button');
      expect(removeBtn).toBeDisabled();
    });

    it('displays environments returned by the API', async () => {
      setupMockServer({ associatedEnvs: [createEnv(10, 'env-alpha')] });
      renderComponent();

      expect(await screen.findByText('env-alpha')).toBeInTheDocument();
    });
  });

  describe('Removing environments', () => {
    it('enables Remove button when a row is selected', async () => {
      const user = userEvent.setup();
      setupMockServer({ associatedEnvs: [createEnv(10, 'env-to-remove')] });
      renderComponent();

      await screen.findByText('env-to-remove');

      // First checkbox is the select-all header, second is the first row
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByTestId('remove-environments-button')).toBeEnabled();
      });
    });

    it('calls PUT with filtered environment IDs after confirming remove', async () => {
      const user = userEvent.setup();
      let requestBody: unknown;

      setupMockServer({
        associatedEnvs: [createEnv(10, 'env-a'), createEnv(11, 'env-b')],
        onPut: (body) => {
          requestBody = body;
        },
      });
      renderComponent();

      await screen.findByText('env-a');

      // Select first row checkbox
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      const removeBtn = await screen.findByTestId('remove-environments-button');
      await waitFor(() => expect(removeBtn).toBeEnabled());
      await user.click(removeBtn);

      await waitFor(() => {
        expect(requestBody).toMatchObject({
          AssociatedEndpoints: [11],
        });
      });
    });
  });

  describe('Adding environments (drawer)', () => {
    it('opens the drawer when Add button is clicked', async () => {
      const user = userEvent.setup();
      setupMockServer({ availableEnvs: [createEnv(20, 'available-env')] });
      renderComponent();

      const addBtn = await screen.findByTestId('add-environments-button');
      await user.click(addBtn);

      expect(await screen.findByText('Add environments')).toBeVisible();
    });

    it('calls PUT with merged IDs when environments are added from drawer', async () => {
      const user = userEvent.setup();
      let requestBody: unknown;

      setupMockServer({
        associatedEnvs: [createEnv(10, 'existing-env')],
        availableEnvs: [createEnv(20, 'new-env')],
        onPut: (body) => {
          requestBody = body;
        },
      });
      renderComponent();

      // Open drawer
      const addBtn = await screen.findByTestId('add-environments-button');
      await user.click(addBtn);

      // Wait for drawer to open and available env to appear
      await screen.findByText('Add environments');
      await screen.findByText('new-env');

      // Select the available env — find the drawer's checkboxes
      // The drawer table has its own checkboxes after the main table ones
      const allCheckboxes = screen.getAllByRole('checkbox');
      // Last checkbox belongs to the drawer table row
      await user.click(allCheckboxes[allCheckboxes.length - 1]);

      // Click the Add button in the drawer footer
      const confirmAddBtn = screen.getByTestId(
        'add-environments-confirm-button'
      );
      await user.click(confirmAddBtn);

      await waitFor(() => {
        expect(requestBody).toMatchObject({
          AssociatedEndpoints: expect.arrayContaining([10, 20]),
        });
      });
    });
  });
});
