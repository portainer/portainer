import { CornerLeftUp, File as FileIcon, Upload } from 'lucide-react';
import { useState } from 'react';

import { Authorized } from '@/react/hooks/useUser';

import { Datatable } from '@@/datatables';
import { BasicTableSettings } from '@@/datatables/types';
import { Button } from '@@/buttons';
import { TableState } from '@@/datatables/useTableState';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { FileData } from './types';
import { columns } from './columns';

interface Props {
  title: string;
  dataset: FileData[];
  tableState: TableState<BasicTableSettings>;

  isRoot: boolean;
  onGoToParent: () => void;
  onBrowse: (folderName: string) => void;
  onRename: (oldName: string, newName: string) => void;
  onDownload: (fileName: string) => void;
  onDelete: (fileName: string) => void;

  isUploadAllowed: boolean;
  onFileSelectedForUpload: (file: File) => void;
}

function goToParent(onClick: () => void): FileData {
  return {
    custom: (
      <Button
        onClick={onClick}
        color="link"
        icon={CornerLeftUp}
        className="!m-0 !p-0"
        data-cy="component-goToParentButton"
      >
        Go to parent
      </Button>
    ),
    Dir: true,
    Name: '..',
    Size: 0,
    ModTime: 0,
  };
}

export function FilesTable({
  isRoot,
  title,
  dataset,
  tableState,
  onGoToParent,
  onRename,
  onBrowse,
  onDelete,
  onDownload,
  isUploadAllowed,
  onFileSelectedForUpload,
}: Props) {
  const [isEditState, setIsEditState] = useState(
    Object.fromEntries(dataset.map((f) => [f.Name, false]))
  );

  function isEdit(name: string) {
    return isEditState[name];
  }

  function setIsEdit(name: string, value: boolean) {
    setIsEditState((editState) => ({ ...editState, [name]: value }));
  }

  return (
    <Datatable<FileData>
      title={title}
      titleIcon={FileIcon}
      dataset={isRoot ? dataset : [goToParent(onGoToParent), ...dataset]}
      settingsManager={tableState}
      columns={columns}
      getRowId={(row) => row.Name}
      initialTableState={{
        columnVisibility: {
          Dir: false,
        },
      }}
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'files',
          isEdit,
          setIsEdit,
          onRename,
          onBrowse,
          onDownload,
          onDelete,
        })
      )}
      disableSelect
      data-cy="files-datatable"
      renderTableActions={() => {
        if (!isUploadAllowed) {
          return null;
        }

        return (
          <Authorized authorizations="DockerAgentBrowsePut">
            <div className="flex flex-row items-center">
              <Button
                color="light"
                icon={Upload}
                as="label"
                data-cy="docker-agent-file-upload-button"
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onFileSelectedForUpload(file);
                    }
                  }}
                />
              </Button>
            </div>
          </Authorized>
        );
      }}
    />
  );
}
