import { DownloadIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Widget } from '@@/Widget';
import { TextTip } from '@@/Tip/TextTip';
import { Button } from '@@/buttons';

import { DateRangePicker } from '../components/DateRangePicker';

export function FilterBar({
  value,
  onChange,
  onExport,
}: {
  value: { start: Date; end: Date | null } | undefined;
  onChange: (value?: { start: Date; end: Date | null }) => void;
  onExport: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Widget>
      <Widget.Body>
        <form className="form-horizontal">
          <DateRangePicker value={value} onChange={onChange} />

          <TextTip color="blue">
            {t('activity_logs.retention_note')}
          </TextTip>

          <div className="mt-4">
            <Button
              color="primary"
              icon={DownloadIcon}
              onClick={onExport}
              className="!ml-0"
              data-cy="activity-logs-export-csv-button"
            >
              {t('common.export_csv')}
            </Button>
          </div>
        </form>
      </Widget.Body>
    </Widget>
  );
}
