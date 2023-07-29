import { CellContext } from '@tanstack/react-table';
import { AlertCircle, HelpCircle, Settings } from 'lucide-react';

import {
  EnvironmentStatus,
  EnvironmentStatusMessage,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';
import { Button } from '@@/buttons';

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
        {environment.StatusMessage?.Summary &&
          environment.StatusMessage?.Detail && (
            <div className="ml-2 inline-block">
              <span className="text-danger vertical-center inline-flex">
                <AlertCircle className="lucide" aria-hidden="true" />
                <span>{environment.StatusMessage.Summary}</span>
              </span>
              <TooltipWithChildren
                message={
                  <div>
                    {environment.StatusMessage.Detail}
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

  if (environment.Type === 4) {
    return <>-</>;
  }

  if (environment.Status === 3) {
    const status = (
      <span className="vertical-center inline-flex text-base">
        <Settings className="lucide animate-spin-slow" />
        {environment.StatusMessage?.Summary}
      </span>
    );
    if (!environment.StatusMessage?.Detail) {
      return status;
    }
    return (
      <TooltipWithChildren
        message={environment.StatusMessage?.Detail}
        position="bottom"
      >
        {status}
      </TooltipWithChildren>
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
