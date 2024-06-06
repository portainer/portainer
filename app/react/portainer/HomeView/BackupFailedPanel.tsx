import { useQuery } from '@tanstack/react-query';

import { error as notifyError } from '@/portainer/services/notifications';
import { getBackupStatus } from '@/portainer/services/api/backup.service';
import { isoDate } from '@/portainer/filters/filters';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

export function BackupFailedPanel() {
  const { status, isLoading } = useBackupStatus();

  if (isLoading || !status || !status.Failed) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <InformationPanel title="Information">
          <TextTip>
            The latest automated backup has failed at{' '}
            {isoDate(status.TimestampUTC)}. For details please see the log files
            and have a look at the{' '}
            <Link to="portainer.settings" data-cy="backup-failed-settings-link">
              settings
            </Link>{' '}
            to verify the backup configuration.
          </TextTip>
        </InformationPanel>
      </div>
    </div>
  );
}

function useBackupStatus() {
  const { data, isLoading } = useQuery(
    ['backup', 'status'],
    () => getBackupStatus(),
    {
      onError(error) {
        notifyError('Failure', error as Error, 'Failed to get license info');
      },
    }
  );

  return { status: data, isLoading };
}
