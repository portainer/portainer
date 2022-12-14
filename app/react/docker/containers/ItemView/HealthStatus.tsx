import { ComponentProps } from 'react';
import { HeartPulse, Server } from 'lucide-react';

import { TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';
import { Icon } from '@@/Icon';

import { Health } from '../types/response';

const StatusMode: Record<
  Health['Status'],
  ComponentProps<typeof Icon>['mode']
> = {
  healthy: 'success',
  unhealthy: 'danger',
  starting: 'warning',
};

interface Props {
  health: Health;
}

export function HealthStatus({ health }: Props) {
  return (
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <TableContainer>
          <TableTitle label="Container health" icon={Server} />

          <DetailsTable>
            <DetailsTable.Row label="Status">
              <div className="vertical-center">
                <Icon
                  icon={HeartPulse}
                  mode={StatusMode[health.Status]}
                  className="space-right"
                />
                {health.Status}
              </div>
            </DetailsTable.Row>

            <DetailsTable.Row label="Failure count">
              {health.FailingStreak}
            </DetailsTable.Row>

            <DetailsTable.Row label="Last output">
              {health.Log[health.Log.length - 1].Output}
            </DetailsTable.Row>
          </DetailsTable>
        </TableContainer>
      </div>
    </div>
  );
}
