import { createColumnHelper } from '@tanstack/react-table';
import { ListIcon } from 'lucide-react';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { Datatable } from '@@/datatables';
import { withControlledSelected } from '@@/datatables/extend-options/withControlledSelected';

import { RegistryGitlabProject } from '../../types/gitlabProject';

const helper = createColumnHelper<RegistryGitlabProject>();

const columns = [
  helper.accessor('Namespace', {}),
  helper.accessor('Name', {}),
  helper.accessor('PathWithNamespace', {
    header: 'Path with namespace',
  }),
  helper.accessor('Description', {}),
];

const tableKey = 'gitlab-projects';
const store = createPersistedStore(tableKey, 'Name');

export function GitlabProjectTable({
  dataset,
  value,
  onChange,
}: {
  dataset: RegistryGitlabProject[];
  value: RegistryGitlabProject[];
  onChange: (value: RegistryGitlabProject[]) => void;
}) {
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      columns={columns}
      dataset={dataset}
      settingsManager={tableState}
      emptyContentLabel="No projects available."
      title="Gitlab projects"
      titleIcon={ListIcon}
      extendTableOptions={withControlledSelected(
        (ids) => onChange(dataset.filter(({ Id }) => ids.includes(`${Id}`))),
        value.map(({ Id }) => `${Id}`)
      )}
      isRowSelectable={({ original: item }) => item.RegistryEnabled}
    />
  );
}
