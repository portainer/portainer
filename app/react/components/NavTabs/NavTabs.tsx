import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './NavTabs.module.css';

export interface Option<T extends string | number = string> {
  label: string | ReactNode;
  children?: ReactNode;
  id: T;
}

interface Props<T extends string | number> {
  options: Option<T>[];
  selectedId?: T;
  onSelect?(id: T): void;
  disabled?: boolean;
}

export function NavTabs<T extends string | number = string>({
  options,
  selectedId,
  onSelect = () => {},
  disabled,
}: Props<T>) {
  const selected = options.find((option) => option.id === selectedId);

  return (
    <div className="nav-container">
      <ul className="nav nav-tabs">
        {options.map((option) => (
          <li
            className={clsx({
              active: option.id === selectedId,
              [styles.parent]: !option.children,
              disabled,
            })}
            key={option.id}
          >
            {/* rule disabled because `nav-tabs` requires an anchor */}
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a
              onClick={() => handleSelect(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleSelect(option);
                }
              }}
              role="button"
              tabIndex={0}
            >
              {option.label}
            </a>
          </li>
        ))}
      </ul>
      {selected && selected.children && (
        <div className="tab-content mt-3">{selected.children}</div>
      )}
    </div>
  );

  function handleSelect(option: Option<T>) {
    if (disabled) {
      return;
    }

    if (option.children) {
      onSelect(option.id);
    }
  }
}
