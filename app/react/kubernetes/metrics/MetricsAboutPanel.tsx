import { ReactNode } from 'react';
import { InfoIcon } from 'lucide-react';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { RefreshRateSelect } from '@@/RefreshRateSelect';

const REFRESH_RATES_MS = [30_000, 60_000] as const;

type Props = {
  description: ReactNode;
  textClassName: string;
  refreshRateMS: number;
  onRefreshRateChange(refreshRateMS: number): void;
  dataCy: string;
};

export function MetricsAboutPanel({
  description,
  textClassName,
  refreshRateMS,
  onRefreshRateChange,
  dataCy,
}: Props) {
  return (
    <Widget>
      <WidgetTitle icon={InfoIcon} title="About statistics" />
      <WidgetBody>
        <form className="form-horizontal">
          <div className="form-group">
            <div className="col-sm-12">
              <span className={`small ${textClassName}`}>{description}</span>
            </div>
          </div>
          <RefreshRateSelect
            refreshRateMS={refreshRateMS}
            onChange={onRefreshRateChange}
            options={REFRESH_RATES_MS}
            dataCy={dataCy}
          />
        </form>
      </WidgetBody>
    </Widget>
  );
}
