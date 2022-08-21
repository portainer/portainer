import { Clock, Trash2 } from 'react-feather';

import { Datatable } from '@@/datatables';
import { PageHeader } from '@@/PageHeader';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';

import { useGetList } from '../queries/list';

import { columns } from './columns';
import { createStore } from './datatable-store';

const storageKey = 'update-schedules-list';
const useStore = createStore(storageKey);

export function ListView() {
  const listQuery = useGetList();
  const store = useStore();

  if (!listQuery.data) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="Upgrade & Rollback"
        reload
        breadcrumbs="Upgrade and rollback"
      />

      <Datatable
        columns={columns}
        titleOptions={{
          title: 'Upgrade & rollback',
          icon: Clock,
        }}
        dataset={listQuery.data}
        settingsStore={store}
        storageKey={storageKey}
        emptyContentLabel="No schedules found"
        isLoading={listQuery.isLoading}
        totalCount={listQuery.data.length}
        renderTableActions={() => <TableActions />}
      />
    </>
  );
}

function TableActions() {
  return (
    <>
      <Button icon={Trash2} color="dangerlight" onClick={() => {}}>
        Remove
      </Button>

      <Link to=".create">
        <Button>Add upgrade & rollback schedule</Button>
      </Link>
    </>
  );
}
