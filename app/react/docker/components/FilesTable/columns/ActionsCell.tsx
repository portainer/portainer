import { CellContext } from '@tanstack/react-table';
import { Download, Edit, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { Button } from '@@/buttons';

import { FileData } from '../types';

export function ActionsCell({
  row: { original: item },
  table,
}: CellContext<FileData, unknown>) {
  return (
    <div className="flex gap-2">
      {!item.Dir && (
        <Authorized authorizations="DockerAgentBrowseGet">
          <Button
            color="secondary"
            size="xsmall"
            onClick={() => table.options.meta?.onDownload(item.Name)}
            icon={Download}
            className="!m-0"
          >
            Download
          </Button>
        </Authorized>
      )}
      <Authorized authorizations="DockerAgentBrowseRename">
        <Button
          color="secondary"
          size="xsmall"
          icon={Edit}
          onClick={() => table.options.meta?.setIsEdit(item.Name, true)}
          className="!m-0"
        >
          Rename
        </Button>
      </Authorized>
      <Authorized authorizations="DockerAgentBrowseDelete">
        <Button
          color="dangerlight"
          size="xsmall"
          icon={Trash2}
          onClick={() => table.options.meta?.onDelete(item.Name)}
          className="!m-0"
        >
          Delete
        </Button>
      </Authorized>
    </div>
  );
}
