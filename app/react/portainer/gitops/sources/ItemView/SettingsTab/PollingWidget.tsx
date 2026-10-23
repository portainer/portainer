import { RefreshCwIcon } from 'lucide-react';

import { Card } from '@@/primitives/Card';

import { DetailField } from './DetailField';

interface Props {
  interval?: string;
}

export function PollingWidget({ interval }: Props) {
  return (
    <Card.Container>
      <Card.Header
        icon={RefreshCwIcon}
        title="Polling"
        subtitle="Periodically fetch this repository to detect changes"
      />
      <Card.Body>
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Status">
            <span className="text-gray-6 th-dark:text-gray-5">
              {interval ? 'Enabled' : 'Disabled'}
            </span>
          </DetailField>
          {interval && (
            <DetailField label="Interval">
              <span className="text-gray-6 th-dark:text-gray-5">
                {interval}
              </span>
            </DetailField>
          )}
        </div>
      </Card.Body>
    </Card.Container>
  );
}
