import { ShieldAlertIcon } from 'lucide-react';
import { capitalize } from 'lodash';
import moment from 'moment';

import { Card } from '@@/primitives/Card';
import { StatusDot } from '@@/primitives/StatusDot';
import { Badge } from '@@/Badge';
import { Alert } from '@@/Alert';

import { SourceDetail } from '../../queries/useSource';

import { DetailField } from './DetailField';

interface Props {
  source: SourceDetail;
}

export function SyncStatusWidget({ source }: Props) {
  const lastSyncLabel = source.lastSync
    ? moment.unix(source.lastSync).fromNow()
    : '-';

  const dotColor = getStatusColor(source.status);

  const statusLabel = source.status ? capitalize(source.status) : '-';

  return (
    <Card.Container>
      <Card.Header
        icon={ShieldAlertIcon}
        title="Sync Status"
        subtitle="Health and timing of the last sync"
      />
      <Card.Body className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Status">
            {source.status ? (
              <Badge type={dotColor} shape="pill" data-cy="source-status">
                <StatusDot color={dotColor} size="xs" /> {statusLabel}
              </Badge>
            ) : (
              '-'
            )}
          </DetailField>
          <DetailField label="Last Sync">
            <span data-cy="source-last-sync">{lastSyncLabel}</span>
          </DetailField>
        </div>
        {source.error && <Alert color="error">{source.error}</Alert>}
      </Card.Body>
    </Card.Container>
  );
}

function getStatusColor(
  status?: SourceDetail['status']
): 'success' | 'warn' | 'danger' | 'info' | 'muted' {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'error':
      return 'danger';
    case 'syncing':
      return 'warn';
    case 'paused':
      return 'muted';
    case 'unknown':
    case undefined:
    default:
      return 'muted';
  }
}
