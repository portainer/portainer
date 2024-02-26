import { Clipboard, Plus, Trash2 } from 'lucide-react';

import { Authorized, useAuthorizations } from '@/react/hooks/useUser';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';
import { useRepeater } from '@@/datatables/useRepeater';
import { Button } from '@@/buttons';
import { Link } from '@@/Link';
import { useTableState } from '@@/datatables/useTableState';

import { DockerConfig } from '../../types';

import { columns } from './columns';
import { createStore } from './store';

interface Props {
  dataset: Array<DockerConfig>;
  onRemoveClick: (configs: Array<DockerConfig>) => void;
  onRefresh: () => Promise<void>;
}

const storageKey = 'docker_configs';
const settingsStore = createStore(storageKey);

export function ConfigsDatatable({ dataset, onRefresh, onRemoveClick }: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  useRepeater(tableState.autoRefreshRate, onRefresh);

  const hasWriteAccessQuery = useAuthorizations([
    'DockerConfigCreate',
    'DockerConfigDelete',
  ]);

  return (
    <Datatable
      dataset={dataset}
      columns={columns}
      settingsManager={tableState}
      title="Configs"
      titleIcon={Clipboard}
      emptyContentLabel="No config available."
      renderTableSettings={() => (
        <TableSettingsMenu>
          <TableSettingsMenuAutoRefresh
            value={tableState.autoRefreshRate}
            onChange={(value) => tableState.setAutoRefreshRate(value)}
          />
        </TableSettingsMenu>
      )}
      disableSelect={!hasWriteAccessQuery.authorized}
      renderTableActions={(selectedRows) =>
        hasWriteAccessQuery.authorized && (
          <div className="flex items-center gap-3">
            <Authorized authorizations="DockerConfigDelete">
              <Button
                icon={Trash2}
                color="dangerlight"
                onClick={() => onRemoveClick(selectedRows)}
                disabled={selectedRows.length === 0}
              >
                Remove
              </Button>
            </Authorized>

            <Authorized authorizations="DockerConfigCreate">
              <Button
                icon={Plus}
                as={Link}
                props={{ to: 'docker.configs.new' }}
              >
                Add config
              </Button>
            </Authorized>
          </div>
        )
      }
    />
  );
}
