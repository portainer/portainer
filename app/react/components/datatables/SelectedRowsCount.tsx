import { useTranslation } from 'react-i18next';

interface SelectedRowsCountProps {
  value: number;
  hidden: number;
}

export function SelectedRowsCount({ value, hidden }: SelectedRowsCountProps) {
  const { t } = useTranslation();
  return value !== 0 ? (
    <div className="infoBar">
      {t('common.items_selected', { count: value })}
      {hidden !== 0 && ` ${t('common.items_hidden_by_filters', { count: hidden })}`}
    </div>
  ) : null;
}
