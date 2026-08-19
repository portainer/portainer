import clsx from 'clsx';
import { useState } from 'react';
import { Check } from 'lucide-react';

import { Checkbox } from '@@/form-components/Checkbox';
import { Icon } from '@@/Icon';

import styles from './TableSettingsMenuAutoRefresh.module.css';

interface Props {
  onChange(valueMS: number): void;
  value: number;
}

const SECOND_MS = 1000;
const DEFAULT_REFRESH_RATE_MS = 10 * SECOND_MS;

export function TableSettingsMenuAutoRefresh({ onChange, value }: Props) {
  const [isCheckVisible, setIsCheckVisible] = useState(false);

  const isEnabled = value > 0;

  return (
    <>
      <Checkbox
        id="settings-auto-refresh"
        data-cy="settings-auto-refresh"
        label="Auto refresh"
        checked={isEnabled}
        onChange={(e) =>
          onChange(e.target.checked ? DEFAULT_REFRESH_RATE_MS : 0)
        }
      />

      {isEnabled && (
        <div>
          <label htmlFor="settings_refresh_rate">Refresh rate</label>
          <select
            data-cy="settings-refresh-rate"
            id="settings_refresh_rate"
            className="small-select"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value={10 * SECOND_MS}>10s</option>
            <option value={30 * SECOND_MS}>30s</option>
            <option value={60 * SECOND_MS}>1min</option>
            <option value={120 * SECOND_MS}>2min</option>
            <option value={300 * SECOND_MS}>5min</option>
          </select>
          <span
            className={clsx(
              isCheckVisible ? styles.alertVisible : styles.alertHidden,
              styles.check
            )}
            onTransitionEnd={() => setIsCheckVisible(false)}
          >
            <Icon icon={Check} className="!ml-1" mode="success" />
          </span>
        </div>
      )}
    </>
  );

  function handleChange(value: string) {
    onChange(Number(value));
    setIsCheckVisible(true);
  }
}
