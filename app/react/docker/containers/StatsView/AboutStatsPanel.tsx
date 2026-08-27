import { InfoIcon } from 'lucide-react';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { RefreshRateSelect } from '@@/RefreshRateSelect';

const REFRESH_RATES_MS = [1000, 3000, 5000, 10_000, 30_000, 60_000] as const;

type Props = {
  containerName: string;
  refreshRateMS: number;
  onRefreshRateChange(refreshRateMS: number): void;
  networkUnavailable: boolean;
  ioUnavailable: boolean;
};

export function AboutStatsPanel({
  containerName,
  refreshRateMS,
  onRefreshRateChange,
  networkUnavailable,
  ioUnavailable,
}: Props) {
  return (
    <Widget>
      <WidgetTitle icon={InfoIcon} title="About statistics" />
      <WidgetBody>
        <form className="form-horizontal">
          <div className="form-group">
            <div className="col-sm-12">
              <span className="small text-muted">
                This view displays real-time statistics about the container{' '}
                <b>{containerName}</b> as well as a list of the running
                processes inside this container.
              </span>
            </div>
          </div>

          <RefreshRateSelect
            refreshRateMS={refreshRateMS}
            onChange={onRefreshRateChange}
            options={REFRESH_RATES_MS}
            dataCy="docker-containers-stats-refresh-rate"
          />

          {networkUnavailable && (
            <div className="form-group">
              <div className="col-sm-12">
                <span className="small text-muted">
                  Network stats are unavailable for this container.
                </span>
              </div>
            </div>
          )}
          {ioUnavailable && (
            <div className="form-group">
              <div className="col-sm-12">
                <span className="small text-muted">
                  I/O stats are unavailable for this container.
                </span>
              </div>
            </div>
          )}
        </form>
      </WidgetBody>
    </Widget>
  );
}
