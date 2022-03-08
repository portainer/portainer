import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { InformationPanel } from '../components/InformationPanel';
import { TextTip } from '../components/Tip/TextTip';
import { getBackupStatus } from '../services/api/backup.service';
import { isoDate } from '../filters/filters';
import { Link } from '../components/Link';

export function BackupFailedPanel() {
  const { status, isLoading } = useBackupStatus();

  if (isLoading || !status || !status.Failed) {
    return null;
  }

  return (
    <InformationPanel title="Information">
      <TextTip>
        The latest automated backup has failed at {isoDate(status.TimestampUTC)}
        . For details please see the log files and have a look at the{' '}
        <Link to="portainer.settings">settings</Link> to verify the backup
        configuration.
      </TextTip>
    </InformationPanel>
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
