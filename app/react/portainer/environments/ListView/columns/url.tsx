import { CellContext } from '@tanstack/react-table';
import { AlertCircle, HelpCircle, Loader2 } from 'lucide-react';

import {
  EnvironmentStatus,
  EnvironmentStatusMessage,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { Tooltip } from '@@/Tip/Tooltip';

import { EnvironmentListItem } from '../types';
import { useUpdateEnvironmentMutation } from '../../queries/useUpdateEnvironmentMutation';

import { columnHelper } from './helper';

export const url = columnHelper.accessor('URL', {
  header: 'URL',
  cell: Cell,
});

function Cell({
  row: { original: environment },
}: CellContext<EnvironmentListItem, string>) {
  const mutation = useUpdateEnvironmentMutation();

  if (
    environment.Type !== EnvironmentType.EdgeAgentOnDocker &&
    environment.Status !== EnvironmentStatus.Provisioning
  ) {
    return (
      <>
        {environment.URL}
        {environment.StatusMessage?.summary &&
          environment.StatusMessage?.detail && (
            <div className="ml-2 inline-block">
              <span className="text-danger vertical-center inline-flex">
                <AlertCircle className="lucide" aria-hidden="true" />
                <span>{environment.StatusMessage.summary}</span>
              </span>
              <TooltipWithChildren
                message={
                  <div>
                    {environment.StatusMessage.detail}
                    {environment.URL && (
                      <div className="mt-2 text-right">
                        <Button
                          color="link"
                          className="small !ml-0 p-0"
                          onClick={handleDismissButton}
                        >
                          <span className="text-muted-light">
                            Dismiss error (still visible in logs)
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>
                }
                position="bottom"
              >
                <span className="vertical-center inline-flex text-base">
                  <HelpCircle className="lucide ml-1" aria-hidden="true" />
                </span>
              </TooltipWithChildren>
            </div>
          )}
      </>
    );
  }

  if (environment.Type === EnvironmentType.EdgeAgentOnDocker) {
    return <>-</>;
  }

  if (environment.Status === EnvironmentStatus.Provisioning) {
    return (
      <div className="inline-flex items-center text-base">
        <Icon icon={Loader2} className="!mr-1 animate-spin-slow" />
        {environment.StatusMessage?.summary}
        {environment.StatusMessage?.detail && (
          <Tooltip message={environment.StatusMessage?.detail} />
        )}
      </div>
    );
  }

  return <>-</>;

  function handleDismissButton() {
    mutation.mutate(
      {
        id: environment.Id,
        payload: {
          IsSetStatusMessage: true,
          StatusMessage: {} as EnvironmentStatusMessage,
        },
      },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Error dismissed successfully');
        },
      }
    );
  }
}
