import {
  ChevronDown,
  Download,
  List,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuPopover } from '@reach/menu-button';
import { positionRight } from '@reach/popover';
import { useMemo } from 'react';

import { Environment } from '@/react/portainer/environments/types';
import { Authorized } from '@/react/hooks/useUser';

import { Datatable, TableSettingsMenu } from '@@/datatables';
import {
  BasicTableSettings,
  createPersistedStore,
  refreshableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { Button, ButtonGroup, LoadingButton } from '@@/buttons';
import { Link } from '@@/Link';
import { ButtonWithRef } from '@@/buttons/Button';
import { useRepeater } from '@@/datatables/useRepeater';
import { TableSettingsMenuAutoRefresh } from '@@/datatables/TableSettingsMenuAutoRefresh';

import { DockerImage } from '../../types';

import { columns as defColumns } from './columns';
import { host as hostColumn } from './columns/host';
import { RowProvider } from './RowContext';

const tableKey = 'images';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings {}

const settingsStore = createPersistedStore<TableSettings>(
  tableKey,
  'tags',
  (set) => ({
    ...refreshableSettings(set),
  })
);

export function ImagesDatatable({
  dataset,

  environment,
  isHostColumnVisible,
  isExportInProgress,
  onDownload,
  onRefresh,
  onRemove,
}: {
  dataset: Array<DockerImage>;
  environment: Environment;
  isHostColumnVisible: boolean;

  onDownload: (images: Array<DockerImage>) => void;
  onRemove: (images: Array<DockerImage>, force: true) => void;
  onRefresh: () => Promise<void>;
  isExportInProgress: boolean;
}) {
  const tableState = useTableState(settingsStore, tableKey);
  const columns = useMemo(
    () => (isHostColumnVisible ? [...defColumns, hostColumn] : defColumns),
    [isHostColumnVisible]
  );

  useRepeater(tableState.autoRefreshRate, onRefresh);

  return (
    <RowProvider context={{ environment }}>
      <Datatable
        title="Images"
        titleIcon={List}
        renderTableActions={(selectedItems) => (
          <div className="flex items-center gap-2">
            <RemoveButtonMenu
              selectedItems={selectedItems}
              onRemove={onRemove}
            />

            <ImportExportButtons
              isExportInProgress={isExportInProgress}
              onExportClick={onDownload}
              selectedItems={selectedItems}
            />

            <Authorized authorizations="DockerImageBuild">
              <Button
                as={Link}
                props={{ to: 'docker.images.build' }}
                data-cy="image-buildImageButton"
                icon={Plus}
              >
                Build a new image
              </Button>
            </Authorized>
          </div>
        )}
        dataset={dataset}
        settingsManager={tableState}
        columns={columns}
        emptyContentLabel="No images found"
        renderTableSettings={() => (
          <TableSettingsMenu>
            <TableSettingsMenuAutoRefresh
              value={tableState.autoRefreshRate}
              onChange={(value) => tableState.setAutoRefreshRate(value)}
            />
          </TableSettingsMenu>
        )}
      />
    </RowProvider>
  );
}

function RemoveButtonMenu({
  onRemove,
  selectedItems,
}: {
  selectedItems: Array<DockerImage>;
  onRemove(selectedItems: Array<DockerImage>, force: boolean): void;
}) {
  return (
    <Authorized authorizations="DockerImageDelete">
      <ButtonGroup>
        <Button
          size="small"
          color="dangerlight"
          icon={Trash2}
          disabled={selectedItems.length === 0}
          data-cy="image-removeImageButton"
          onClick={() => {
            onRemove(selectedItems, false);
          }}
        >
          Remove
        </Button>
        <Menu>
          <MenuButton
            as={ButtonWithRef}
            size="small"
            color="dangerlight"
            disabled={selectedItems.length === 0}
            icon={ChevronDown}
          >
            <span className="sr-only">Toggle Dropdown</span>
          </MenuButton>
          <MenuPopover position={positionRight}>
            <div className="mt-3 bg-white th-highcontrast:bg-black th-dark:bg-black">
              <MenuItem
                onSelect={() => {
                  onRemove(selectedItems, true);
                }}
              >
                Force Remove
              </MenuItem>
            </div>
          </MenuPopover>
        </Menu>
      </ButtonGroup>
    </Authorized>
  );
}

function ImportExportButtons({
  isExportInProgress,
  selectedItems,
  onExportClick,
}: {
  isExportInProgress: boolean;
  selectedItems: Array<DockerImage>;
  onExportClick(selectedItems: Array<DockerImage>): void;
}) {
  return (
    <ButtonGroup>
      <Authorized authorizations="DockerImageLoad">
        <Button
          size="small"
          color="light"
          as={Link}
          data-cy="image-importImageButton"
          icon={Upload}
          disabled={isExportInProgress}
          props={{ to: 'docker.images.import' }}
        >
          Import
        </Button>
      </Authorized>
      <Authorized authorizations="DockerImageGet">
        <LoadingButton
          size="small"
          color="light"
          icon={Download}
          isLoading={isExportInProgress}
          loadingText="Export in progress..."
          data-cy="image-exportImageButton"
          onClick={() => onExportClick(selectedItems)}
          disabled={selectedItems.length === 0}
        >
          Export
        </LoadingButton>
      </Authorized>
    </ButtonGroup>
  );
}
