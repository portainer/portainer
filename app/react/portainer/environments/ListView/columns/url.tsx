import { CellContext } from '@tanstack/react-table';
import { AlertTriangle, Settings } from 'lucide-react';

import { stripProtocol } from '@/portainer/filters/filters';
import {
  EnvironmentStatus,
  EnvironmentType,
} from '@/react/portainer/environments/types';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { Icon } from '@@/Icon';

import { EnvironmentListItem } from '../types';

import { columnHelper } from './helper';

export const url = columnHelper.accessor('URL', {
  header: 'URL',
  cell: Cell,
});

function Cell({
  getValue,
  row: { original: environment },
}: CellContext<EnvironmentListItem, string>) {
  const url = getValue();
  const cleanUrl = stripProtocol(url);

  if (
    environment.Type !== EnvironmentType.EdgeAgentOnDocker &&
    environment.Status !== EnvironmentStatus.Provisioning
  ) {
    return cleanUrl;
  }

  if (environment.Type === EnvironmentType.EdgeAgentOnDocker) {
    return '-';
  }

  if (environment.Status === EnvironmentStatus.Provisioning) {
    return (
      <TooltipWithChildren message={environment.StatusMessage?.Detail}>
        <span className="flex items-center gap-1">
          <Icon icon={Settings} className="animate-spin-slow" />
          <span className="small">{environment.StatusMessage?.Summary}</span>
        </span>
      </TooltipWithChildren>
    );
  }

  return (
    <>
      {cleanUrl}
      <TooltipWithChildren message={environment.StatusMessage?.Detail}>
        <span className="text-danger flex items-center gap-1">
          <Icon icon={AlertTriangle} mode="danger" />
          <span className="small">{environment.StatusMessage?.Summary}</span>
        </span>
      </TooltipWithChildren>
    </>
  );
}
