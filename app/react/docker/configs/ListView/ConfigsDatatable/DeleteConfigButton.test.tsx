import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { server } from '@/setup-tests/server';
import { Role } from '@/portainer/users/types';
import { createMockUsers } from '@/react-tools/test-mocks';

import { ConfigViewModel } from '../../model';

import { DeleteConfigButton } from './DeleteConfigButton';

vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { endpointId: '1' },
  })),
}));

beforeEach(() => {
  server.use(
    http.get('/api/endpoints/1', () =>
      HttpResponse.json({
        Id: 1,
        Name: 'test-environment',
        Type: 1,
      })
    )
  );
});

afterEach(() => {
  // Clean up any portal elements (modals) that may have been left behind
  document.body.querySelectorAll('reach-portal').forEach((el) => el.remove());
});

it('should render disabled when no items selected', () => {
  renderComponent([]);

  const button = screen.getByRole('button', { name: /remove/i });
  expect(button).toBeVisible();
  expect(button).toBeDisabled();
});

it('should render enabled with selected items', () => {
  const selectedItems = [createMockConfigViewModel({ Id: 'config-1' })];

  renderComponent(selectedItems);

  const button = screen.getByRole('button', { name: /remove/i });
  expect(button).toBeVisible();
  expect(button).toBeEnabled();
});

it('should show confirmation dialog on click', async () => {
  const user = userEvent.setup();
  const selectedItems = [createMockConfigViewModel({ Id: 'config-1' })];

  renderComponent(selectedItems);

  const button = screen.getByRole('button', { name: /remove/i });
  await user.click(button);

  await waitFor(() => {
    expect(
      screen.getByText('Do you want to remove the selected config(s)?')
    ).toBeVisible();
  });
});

it('should call delete API for each selected config on confirm', async () => {
  const user = userEvent.setup();
  const deletedConfigIds: string[] = [];

  server.use(
    http.delete(
      '/api/endpoints/:environmentId/docker/configs/:configId',
      ({ params }) => {
        deletedConfigIds.push(params.configId as string);
        return HttpResponse.json({});
      }
    )
  );

  const selectedItems = [
    createMockConfigViewModel({ Id: 'config-1' }),
    createMockConfigViewModel({ Id: 'config-2' }),
  ];

  renderComponent(selectedItems);

  await user.click(screen.getByRole('button', { name: /remove/i }));

  const dialog = await screen.findByRole('dialog', { name: 'Are you sure?' });
  await user.click(within(dialog).getByRole('button', { name: /remove/i }));

  await waitFor(() => {
    expect(deletedConfigIds).toContain('config-1');
    expect(deletedConfigIds).toContain('config-2');
  });
});

it('should not call delete API when cancel is clicked', async () => {
  const user = userEvent.setup();
  let deleteCallCount = 0;

  server.use(
    http.delete(
      '/api/endpoints/:environmentId/docker/configs/:configId',
      () => {
        deleteCallCount += 1;
        return HttpResponse.json({});
      }
    )
  );

  const selectedItems = [createMockConfigViewModel({ Id: 'config-1' })];

  renderComponent(selectedItems);

  await user.click(screen.getByRole('button', { name: /remove/i }));

  const dialog = await screen.findByRole('dialog', { name: 'Are you sure?' });
  await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

  // Wait a bit to ensure no API call was made
  await new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

  expect(deleteCallCount).toBe(0);
});

function createMockConfigViewModel(
  overrides: Partial<ConfigViewModel> = {}
): ConfigViewModel {
  return {
    Id: 'config-id-1',
    Name: 'test-config',
    CreatedAt: '2024-01-15T10:30:00.000000000Z',
    UpdatedAt: '2024-01-15T10:30:00.000000000Z',
    Version: 1,
    Labels: {},
    Data: 'config data',
    ...overrides,
  } as ConfigViewModel;
}

function renderComponent(selectedItems: ConfigViewModel[] = []) {
  const user = createMockUsers(1, Role.Admin)[0];

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <DeleteConfigButton selectedItems={selectedItems} />
      )),
      user
    )
  );

  return render(<Wrapped />);
}
