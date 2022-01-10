import clsx from 'clsx';
import { useState } from 'react';

import { Checkbox } from '@/portainer/components/form-components/Checkbox';

import styles from './TableSettingsMenuAutoRefresh.module.css';

interface Props {
  onChange(value: number): void;
  value: number;
}

export function TableSettingsMenuAutoRefresh({ onChange, value }: Props) {
  const [isCheckVisible, setIsCheckVisible] = useState(false);

  const isEnabled = value > 0;

  return (
    <>
      <Checkbox
        id="settings-auto-refresh"
        label="Auto refresh"
        checked={isEnabled}
        onChange={(e) => onChange(e.target.checked ? 10 : 0)}
      />

      {isEnabled && (
        <div>
          <label htmlFor="settings_refresh_rate">Refresh rate</label>
          <select
            id="settings_refresh_rate"
            className="small-select"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value={10}>10s</option>
            <option value={30}>30s</option>
            <option value={60}>1min</option>
            <option value={120}>2min</option>
            <option value={300}>5min</option>
          </select>
          <span
            className={clsx(
              isCheckVisible ? styles.alertVisible : styles.alertHidden,
              styles.check
            )}
            onTransitionEnd={() => setIsCheckVisible(false)}
          >
            <i
              id="refreshRateChange"
              className="fa fa-check green-icon"
              aria-hidden="true"
              style={{ marginTop: '7px' }}
            />
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
