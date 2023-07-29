import { ComponentProps } from 'react';

import { FilesTable } from '@/react/docker/components/FilesTable';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

const tableKey = 'host-browser';

const settingsStore = createPersistedStore(tableKey, 'Name');

interface Props
  extends Omit<
    ComponentProps<typeof FilesTable>,
    'onSearchChange' | 'tableState' | 'title'
  > {
  relativePath: string;
}

export function AgentVolumeBrowser({
  relativePath,
  dataset,
  isRoot,
  onBrowse,
  onDelete,
  onDownload,
  onFileSelectedForUpload,
  onGoToParent,
  onRename,
  isUploadAllowed,
}: Props) {
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <FilesTable
      tableState={tableState}
      dataset={dataset}
      title={`Volume browser - ${relativePath}`}
      isRoot={isRoot}
      onRename={onRename}
      onBrowse={onBrowse}
      onDownload={onDownload}
      onDelete={onDelete}
      isUploadAllowed={isUploadAllowed}
      onFileSelectedForUpload={onFileSelectedForUpload}
      onGoToParent={onGoToParent}
    />
  );
}
