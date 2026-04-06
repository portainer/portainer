import _ from 'lodash';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: number;
  onChange(value: number): void;
  showAll?: boolean;
}

export function ItemsPerPageSelector({ value, onChange, showAll }: Props) {
  const { t } = useTranslation();
  const [id] = useState(() => `${_.uniqueId()}-items-per-page`);
  return (
    <span className="limitSelector">
      <label
        className="space-right text-xs font-normal text-[--text-main-color]"
        htmlFor={id}
      >
        {t('common.items_per_page')}
      </label>
      <select
        id={id}
        className="form-control"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-cy="paginationSelect"
      >
        {showAll ? <option value={Number.MAX_SAFE_INTEGER}>{t('common.all')}</option> : null}
        {[10, 25, 50, 100].map((v) => (
          <option value={v} key={v}>
            {v}
          </option>
        ))}
      </select>
    </span>
  );
}
