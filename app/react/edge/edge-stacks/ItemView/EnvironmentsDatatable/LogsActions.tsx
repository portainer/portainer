import clsx from 'clsx';

import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { EdgeStack } from '../../types';

import { useCollectLogsMutation } from './useCollectLogsMutation';
import { useDeleteLogsMutation } from './useDeleteLogsMutation';
import { useDownloadLogsMutation } from './useDownloadLogsMutation';
import { useLogsStatus } from './useLogsStatus';

interface Props {
  environmentId: EnvironmentId;
  edgeStackId: EdgeStack['Id'];
}

export function LogsActions({ environmentId, edgeStackId }: Props) {
  const logsStatusQuery = useLogsStatus(edgeStackId, environmentId);
  const collectLogsMutation = useCollectLogsMutation();
  const downloadLogsMutation = useDownloadLogsMutation();
  const deleteLogsMutation = useDeleteLogsMutation();

  if (!logsStatusQuery.isSuccess) {
    return null;
  }

  const status = logsStatusQuery.data;

  const collecting = collectLogsMutation.isLoading || status === 'pending';

  return (
    <>
      <Button
        className="p-0"
        color="link"
        title="Retrieve logs"
        onClick={handleCollectLogs}
        data-cy="edge-stack-logs-collect-button"
      >
        <Icon
          icon={clsx({
            'file-text': !collecting,
            loader: collecting,
          })}
        />
      </Button>
      <Button
        className="p-0"
        color="link"
        title="Download logs"
        disabled={status !== 'collected'}
        onClick={handleDownloadLogs}
        data-cy="edge-stack-logs-download-button"
      >
        <Icon
          icon={clsx({
            'download-cloud': !downloadLogsMutation.isLoading,
            loader: downloadLogsMutation.isLoading,
          })}
        />
      </Button>
      <Button
        className="p-0"
        color="link"
        title="Delete logs"
        disabled={status !== 'collected'}
        onClick={handleDeleteLogs}
        data-cy="edge-stack-logs-delete-button"
      >
        <Icon
          icon={clsx({
            delete: !deleteLogsMutation.isLoading,
            loader: deleteLogsMutation.isLoading,
          })}
        />
      </Button>
    </>
  );

  function handleCollectLogs() {
    if (status === 'pending') {
      return;
    }

    collectLogsMutation.mutate(
      {
        edgeStackId,
        environmentId,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Logs Collection started');
        },
      }
    );
  }

  function handleDownloadLogs() {
    downloadLogsMutation.mutate({
      edgeStackId,
      environmentId,
    });
  }

  function handleDeleteLogs() {
    deleteLogsMutation.mutate(
      {
        edgeStackId,
        environmentId,
      },
      {
        onSuccess() {
          notifySuccess('Success', 'Logs Deleted');
        },
      }
    );
  }
}
