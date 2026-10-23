import { render, screen } from '@testing-library/react';

import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { TableSettings } from '@/react/kubernetes/datatables/DefaultDatatableSettings';

import { TableState } from '@@/datatables/useTableState';

import { Event } from '../../queries/types';

import { EventsDatatable } from './EventsDatatable';

// Mock the necessary hooks and dependencies
const mockTableState: TableState<TableSettings> = {
  sortBy: { id: 'Date', desc: true },
  pageSize: 10,
  search: '',
  autoRefreshRateMS: 0,
  showSystemResources: false,
  setSortBy: vi.fn(),
  setPageSize: vi.fn(),
  setSearch: vi.fn(),
  setAutoRefreshRate: vi.fn(),
  setShowSystemResources: vi.fn(),
};

vi.mock('../../datatables/default-kube-datatable-store', () => ({
  useKubeStore: () => mockTableState,
}));

function renderComponent() {
  const user = new UserViewModel({ Username: 'user' });

  const events: Event[] = [
    {
      type: 'Warning',
      name: 'name',
      message: 'not sure if this what you want to do',
      namespace: 'default',
      reason: 'unknown',
      count: 1,
      eventTime: new Date('2025-01-02T15:04:05Z'),
      uid: '4500fc9c-0cc8-4695-b4c4-989ac021d1d6',
      involvedObject: {
        kind: 'configMap',
        uid: '35',
        name: 'name',
        namespace: 'default',
      },
    },
  ];

  const Wrapped = withTestQueryProvider(
    withUserProvider(
      withTestRouter(() => (
        <EventsDatatable
          dataset={events}
          tableState={mockTableState}
          isLoading={false}
          data-cy="k8sNodeDetail-eventsTable"
          noWidget
        />
      )),
      user
    )
  );
  return { ...render(<Wrapped />), events };
}

describe('EventsDatatable', () => {
  it('should display events when data is loaded', async () => {
    const { events } = renderComponent();
    const event = events[0];

    expect(screen.getByText(event.message || '')).toBeInTheDocument();
    expect(screen.getAllByText(event.type || '')).toHaveLength(2);
    expect(screen.getAllByText(event.involvedObject.kind || '')).toHaveLength(
      2
    );
  });
});
