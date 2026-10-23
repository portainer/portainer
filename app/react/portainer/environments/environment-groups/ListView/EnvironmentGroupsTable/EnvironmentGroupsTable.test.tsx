import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { PropsWithChildren } from 'react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { server } from '@/setup-tests/server';

import { EnvironmentGroup } from '../../types';

import { EnvironmentGroupsTable } from './EnvironmentGroupsTable';

vi.mock('@@/Link', () => ({
  Link: ({
    children,
    ...props
  }: PropsWithChildren<{ to: string; params?: Record<string, unknown> }>) => (
    <span role="button" tabIndex={0} {...props}>
      {children}
    </span>
  ),
}));

function buildGroup(
  overrides: Partial<EnvironmentGroup> & { Id: number; Name: string }
): EnvironmentGroup {
  return {
    Description: '',
    TagIds: [],
    ...overrides,
  };
}

const mockGroups: Array<EnvironmentGroup> = [
  buildGroup({
    Id: 2,
    Name: 'Production Kubernetes',
    Description: 'Production k8s cluster',
    TagIds: [1, 2],
  }),
  buildGroup({
    Id: 3,
    Name: 'Development Kubernetes',
    TagIds: [1],
  }),
  buildGroup({
    Id: 4,
    Name: 'Docker Hosts',
    TagIds: [3],
  }),
  buildGroup({
    Id: 5,
    Name: 'Staging Mixed',
    TagIds: [2],
  }),
  buildGroup({
    Id: 6,
    Name: 'Edge Fleet',
  }),
];

function searchInput() {
  return screen.getByTestId('environment-groups-list-header-search');
}
function sortByName() {
  return screen.getByTestId(
    'environment-groups-list-header-sort-sort-by-name-button'
  );
}
function nextPageBtn() {
  return screen.getByTitle('Next page');
}
function prevPageBtn() {
  return screen.getByTitle('Previous page');
}

async function waitForLoaded() {
  await waitFor(() => {
    const rows = screen.queryAllByTestId(/^environment-group-row-/);
    const empty = screen.queryByText(
      /No environment groups found|No groups match/
    );
    if (rows.length === 0 && !empty) throw new Error('Still loading');
  });
}

function renderTable() {
  server.use(
    http.get('/api/endpoint_groups', () => HttpResponse.json(mockGroups)),
    http.get('/api/tags', () =>
      HttpResponse.json([
        { ID: 1, Name: 'production' },
        { ID: 2, Name: 'staging' },
        { ID: 3, Name: 'docker' },
      ])
    )
  );

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EnvironmentGroupsTable))
  );

  return render(<Wrapped />);
}

function renderEmptyTable() {
  server.use(http.get('/api/endpoint_groups', () => HttpResponse.json([])));

  const Wrapped = withTestQueryProvider(
    withTestRouter(withUserProvider(EnvironmentGroupsTable))
  );

  return render(<Wrapped />);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('EnvironmentGroupsTable', () => {
  describe('Rendering', () => {
    it('should show loading state initially', () => {
      server.use(
        http.get('/api/endpoint_groups', async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 5000);
          });
          return HttpResponse.json(mockGroups);
        })
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      // Header renders immediately; group rows are not yet visible
      expect(
        screen.getByTestId(
          'environment-groups-list-header-sort-sort-by-name-button'
        )
      ).toBeVisible();
      expect(
        screen.queryByTestId(/^environment-group-row-/)
      ).not.toBeInTheDocument();
    });

    it('should render all groups after loading', async () => {
      renderTable();

      await waitForLoaded();

      mockGroups.forEach((group) => {
        expect(
          screen.getByTestId(`environment-group-row-${group.Name}`)
        ).toBeVisible();
      });
    });

    it('should show empty state when no groups exist', async () => {
      renderEmptyTable();

      expect(
        await screen.findByText('No environment groups found')
      ).toBeVisible();
    });
  });

  describe('Filtering', () => {
    it('should filter groups by name', async () => {
      const user = userEvent.setup();
      renderTable();

      await waitForLoaded();

      await user.type(searchInput(), 'Production');

      // SearchBar debounces input; wait for the filter to apply
      await waitFor(() => {
        expect(
          screen.queryByTestId('environment-group-row-Docker Hosts')
        ).not.toBeInTheDocument();
      });
      expect(
        screen.getByTestId('environment-group-row-Production Kubernetes')
      ).toBeVisible();
    });

    it('should filter case-insensitively', async () => {
      const user = userEvent.setup();
      renderTable();

      await waitForLoaded();

      await user.type(searchInput(), 'docker');

      // SearchBar debounces input; wait for the filter to apply
      await waitFor(() => {
        expect(
          screen.getByTestId('environment-group-row-Docker Hosts')
        ).toBeVisible();
      });
    });

    it('should show no results message when filter matches nothing', async () => {
      const user = userEvent.setup();
      renderTable();

      await waitForLoaded();

      await user.type(searchInput(), 'nonexistent');

      // SearchBar debounces input; wait for the empty state to render
      await waitFor(() => {
        expect(screen.getByText('No groups match your search')).toBeVisible();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by name ascending by default', async () => {
      renderTable();

      await waitForLoaded();

      const rows = screen.getAllByTestId(/^environment-group-row-/);
      expect(rows[0]).toHaveAttribute(
        'data-cy',
        'environment-group-row-Development Kubernetes'
      );
      expect(rows[1]).toHaveAttribute(
        'data-cy',
        'environment-group-row-Docker Hosts'
      );
    });

    it('should toggle sort direction when clicking the active sort', async () => {
      const user = userEvent.setup();
      renderTable();

      await waitForLoaded();

      // Click name again to reverse
      await user.click(sortByName());

      const rows = screen.getAllByTestId(/^environment-group-row-/);
      expect(rows[0]).toHaveAttribute(
        'data-cy',
        'environment-group-row-Staging Mixed'
      );
    });
  });

  describe('Pagination', () => {
    it('should show pagination info when items exist', async () => {
      renderTable();

      await waitForLoaded();

      // SortableListPagerInfo always shows when totalCount > 0
      expect(screen.getByRole('combobox')).toBeVisible();
    });

    it('should show pagination when items exceed page size', async () => {
      const manyGroups = Array.from({ length: 15 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      expect(nextPageBtn()).toBeVisible();
      // Should show 10 items on first page
      const rows = screen.getAllByTestId(/^environment-group-row-/);
      expect(rows).toHaveLength(10);
    });

    it('should navigate to next page', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 15 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      await user.click(nextPageBtn());

      const rows = screen.getAllByTestId(/^environment-group-row-/);
      expect(rows).toHaveLength(5);
    });

    it('should reset to page 1 when filtering', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 15 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Go to page 2
      await user.click(nextPageBtn());
      expect(screen.getAllByTestId(/^environment-group-row-/)).toHaveLength(5);

      // Type a filter - safePage clamps to page 1
      await user.type(searchInput(), 'Group 0');

      // Should show filtered results from page 1
      await waitFor(() => {
        const rows = screen.getAllByTestId(/^environment-group-row-/);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.length).toBeLessThanOrEqual(10);
      });
    });

    it('should reset to page 1 when changing sort', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 15 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Go to page 2
      await user.click(nextPageBtn());

      // Toggle Name sort direction
      await user.click(sortByName());

      expect(screen.getAllByTestId(/^environment-group-row-/)).toHaveLength(10);
    });
  });

  describe('Sort header', () => {
    it('should render the name sort button', async () => {
      renderTable();

      await waitForLoaded();

      expect(sortByName()).toBeVisible();
    });

    it('should render the filter input', async () => {
      renderTable();

      await waitForLoaded();

      expect(searchInput()).toBeVisible();
      expect(searchInput()).toHaveAttribute('placeholder', 'Filter groups...');
    });

    it('should render the add group button in the page header (not in the table)', async () => {
      // The Add Group button lives in ListView's PageHeader, not in EnvironmentGroupsTable.
      // This test confirms it is absent from the table component itself.
      renderTable();

      await waitForLoaded();

      expect(
        screen.queryByTestId('add-environment-group-button')
      ).not.toBeInTheDocument();
    });
  });

  describe('Pagination - Advanced', () => {
    it('should navigate to previous page', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 15 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Go to page 2
      await user.click(nextPageBtn());
      expect(screen.getAllByTestId(/^environment-group-row-/)).toHaveLength(5);

      // Go back to page 1
      await user.click(prevPageBtn());
      expect(screen.getAllByTestId(/^environment-group-row-/)).toHaveLength(10);
    });

    it('should disable next button on last page', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 15 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      const next = nextPageBtn();
      expect(next).not.toBeDisabled();

      // Navigate to the last page (page 2 of 2 with 15 items at 10/page)
      await user.click(next);

      expect(next).toBeDisabled();
    });

    it('should change items per page', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 25 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Initial page should have 10 items
      expect(screen.getAllByTestId(/^environment-group-row-/)).toHaveLength(10);

      // Change to 25 items per page
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '25');

      // Should now show 25 items
      expect(screen.getAllByTestId(/^environment-group-row-/)).toHaveLength(25);
    });

    it('should navigate to specific page number', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 30 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Click page 3
      await user.click(screen.getByRole('button', { name: '3' }));

      // Should show items from page 3
      const rows = screen.getAllByTestId(/^environment-group-row-/);
      expect(rows).toHaveLength(10);
    });

    it('should reset to page 1 after filtering results', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 25 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: i % 2 === 0 ? `ProductionGroup ${i}` : `Group ${i}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Go to page 2
      await user.click(nextPageBtn());

      // Filter - safePage clamps back to page 1
      await user.type(searchInput(), 'Production');

      // Should show filtered results from page 1
      await waitFor(() => {
        const rows = screen.getAllByTestId(/^environment-group-row-/);
        expect(rows.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Group Row Features', () => {
    it('should display ungoverned group', async () => {
      server.use(
        http.get('/api/endpoint_groups', () =>
          HttpResponse.json([
            buildGroup({
              Id: 1,
              Name: 'Unassigned',
            }),
          ])
        )
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      expect(
        screen.getByTestId('environment-group-row-Unassigned')
      ).toBeInTheDocument();
    });
  });

  describe('Combinations - Sorting + Pagination + Filtering', () => {
    it('should maintain sort order after pagination', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 25 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: `Group ${String(i + 1).padStart(2, '0')}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      const firstPageOrder = screen
        .getAllByTestId(/^environment-group-row-/)[0]
        .getAttribute('data-cy');

      // Go to next page
      await user.click(nextPageBtn());

      // Go back to first page
      await user.click(prevPageBtn());

      // Order should be the same
      const returnedFirstRow = screen
        .getAllByTestId(/^environment-group-row-/)[0]
        .getAttribute('data-cy');
      expect(firstPageOrder).toBe(returnedFirstRow);
    });

    it('should apply filter and paginate together', async () => {
      const user = userEvent.setup();

      const manyGroups = Array.from({ length: 20 }, (_, i) =>
        buildGroup({
          Id: i + 1,
          Name: i % 2 === 0 ? `ProdGroup ${i}` : `DevGroup ${i}`,
        })
      );

      server.use(
        http.get('/api/endpoint_groups', () => HttpResponse.json(manyGroups))
      );

      const Wrapped = withTestQueryProvider(
        withTestRouter(withUserProvider(EnvironmentGroupsTable))
      );
      render(<Wrapped />);

      await waitForLoaded();

      // Filter by "Prod"
      await user.type(searchInput(), 'Prod');

      // SearchBar debounces input; wait for filtered rows to settle
      await waitFor(() => {
        const rows = screen.getAllByTestId(/^environment-group-row-/);
        expect(rows.length).toBeGreaterThan(0);
        rows.forEach((row) => {
          expect(row).toHaveAttribute(
            'data-cy',
            expect.stringContaining('ProdGroup')
          );
        });
      });
    });
  });
});
