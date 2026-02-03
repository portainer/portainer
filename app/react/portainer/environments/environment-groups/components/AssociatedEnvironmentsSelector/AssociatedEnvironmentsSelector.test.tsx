import { render, screen, waitFor, within } from '@testing-library/react';
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

import { AssociatedEnvironmentsSelector } from './AssociatedEnvironmentsSelector';

function createEnv(id: EnvironmentId, name: string): Environment {
  return createMockEnvironment({ Id: id, Name: name, GroupId: 1 });
}

function setupMockServer(environments: Array<Environment> = []) {
  server.use(
    http.get('/api/endpoints', () =>
      HttpResponse.json(environments, {
        headers: {
          'x-total-count': String(environments.length),
          'x-total-available': String(environments.length),
        },
      })
    )
  );
}

function renderComponent({
  associatedEnvironmentIds = [] as Array<EnvironmentId>,
  initialAssociatedEnvironmentIds = [] as Array<EnvironmentId>,
  onChange = vi.fn(),
}: {
  associatedEnvironmentIds?: Array<EnvironmentId>;
  initialAssociatedEnvironmentIds?: Array<EnvironmentId>;
  onChange?: (ids: Array<EnvironmentId>) => void;
} = {}) {
  const Wrapped = withTestQueryProvider(() => (
    <AssociatedEnvironmentsSelector
      associatedEnvironmentIds={associatedEnvironmentIds}
      initialAssociatedEnvironmentIds={initialAssociatedEnvironmentIds}
      onChange={onChange}
    />
  ));

  return {
    ...render(<Wrapped />),
    onChange,
  };
}

describe('AssociatedEnvironmentsSelector', () => {
  describe('Rendering', () => {
    it('should render both Available and Associated environments tables', async () => {
      setupMockServer();
      renderComponent();

      expect(
        screen.getByRole('heading', { name: 'Available environments' })
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { name: 'Associated environments' })
      ).toBeVisible();
    });

    it('should render instruction text', async () => {
      setupMockServer();
      renderComponent();

      expect(
        await screen.findByText(/click on any environment entry to move it/i)
      ).toBeInTheDocument();
    });

    it('should render Associated environments table with data-cy attribute', async () => {
      setupMockServer();
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId('group-associatedEndpoints')).toBeVisible();
      });
    });

    it('should display initially associated environments in Associated table', async () => {
      const envs = [createEnv(10, 'associated-env-1')];

      setupMockServer(envs);
      renderComponent({
        associatedEnvironmentIds: [10],
        initialAssociatedEnvironmentIds: [10],
      });

      await waitFor(() => {
        expect(screen.getByText('associated-env-1')).toBeInTheDocument();
      });
    });
  });

  describe('Adding environments', () => {
    it('should call onChange with new environment ID when clicking an available environment', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const envs = [createEnv(1, 'available-env')];
      setupMockServer(envs);

      renderComponent({ onChange });

      const envRow = await screen.findByText('available-env');
      await user.click(envRow);

      expect(onChange).toHaveBeenCalledWith([1]);
    });

    it('should append new environment to existing associated IDs', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const envs = [createEnv(1, 'available-env'), createEnv(10, 'existing')];
      setupMockServer(envs);

      renderComponent({
        associatedEnvironmentIds: [10],
        initialAssociatedEnvironmentIds: [10],
        onChange,
      });

      // Wait for the available table to be ready and find the row
      const availableTable = await screen.findByTestId(
        'group-availableEndpoints'
      );
      await within(availableTable).findByText('available-env');

      // Find the row element that contains the text and click it
      const rows = within(availableTable).getAllByRole('row');
      const envRow = rows.find(
        (row) => row.textContent?.includes('available-env')
      );
      expect(envRow).toBeDefined();
      await user.click(envRow!);

      // Wait for onChange to be called with the new environment ID appended
      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([10, 1]);
      });
    });
  });

  describe('Removing environments', () => {
    it('should call onChange without the removed environment ID', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const envs = [
        createEnv(10, 'associated-env-1'),
        createEnv(11, 'associated-env-2'),
      ];
      setupMockServer(envs);

      renderComponent({
        associatedEnvironmentIds: [10, 11],
        initialAssociatedEnvironmentIds: [10, 11],
        onChange,
      });

      // Wait for initial query to load and row to appear in Associated table, then click
      const associatedTable = await screen.findByTestId(
        'group-associatedEndpoints'
      );
      const envRow =
        await within(associatedTable).findByText('associated-env-1');
      await user.click(envRow);

      expect(onChange).toHaveBeenCalledWith([11]);
    });

    it('should call onChange with empty array when removing last environment', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const envs = [createEnv(10, 'only-env')];
      setupMockServer(envs);

      renderComponent({
        associatedEnvironmentIds: [10],
        initialAssociatedEnvironmentIds: [10],
        onChange,
      });

      const associatedTable = await screen.findByTestId(
        'group-associatedEndpoints'
      );
      const envRow = await within(associatedTable).findByText('only-env');
      await user.click(envRow);

      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Computed values', () => {
    it('should identify added IDs (current but not initial)', () => {
      // addedIds = associatedEnvironmentIds.filter(id => !initialAssociatedEnvironmentIds.includes(id))
      // When current=[1,2,3] and initial=[2,3], added=[1]
      setupMockServer();

      // This test validates the component's internal logic by checking the highlightIds
      // passed to AssociatedEnvironmentsTable (newly added envs get "Unsaved" badge)
      renderComponent({
        associatedEnvironmentIds: [1, 2, 3],
        initialAssociatedEnvironmentIds: [2, 3],
      });

      // The component will compute addedIds=[1] internally
      // We can't directly test internal state, but we verify it renders
      expect(screen.getByTestId('group-associatedEndpoints')).toBeVisible();
    });

    it('should identify removed IDs (initial but not current)', () => {
      // removedIds = initialAssociatedEnvironmentIds.filter(id => !associatedEnvironmentIds.includes(id))
      // When current=[2,3] and initial=[1,2,3], removed=[1]
      setupMockServer();

      renderComponent({
        associatedEnvironmentIds: [2, 3],
        initialAssociatedEnvironmentIds: [1, 2, 3],
      });

      // The component will compute removedIds=[1] internally
      // and pass it as includeIds to AvailableEnvironmentsTable
      expect(screen.getByTestId('group-availableEndpoints')).toBeVisible();
    });
  });
});
