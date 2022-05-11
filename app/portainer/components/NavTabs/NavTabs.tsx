import clsx from 'clsx';
import { ReactNode } from 'react';

import styles from './NavTabs.module.css';

export interface Option {
  label: string | ReactNode;
  children?: ReactNode;
  id: string | number;
}

interface Props {
  options: Option[];
  selectedId?: string | number;
  onSelect?(id: string | number): void;
}

export function NavTabs({ options, selectedId, onSelect = () => {} }: Props) {
  const selected = options.find((option) => option.id === selectedId);

  return (
    <>
      <ul className="nav nav-tabs">
        {options.map((option) => (
          <li
            className={clsx({
              active: option.id === selectedId,
              [styles.parent]: !option.children,
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
        <div className="tab-content">{selected.children}</div>
      )}
    </>
  );

  function handleSelect(option: Option) {
    if (option.children) {
      onSelect(option.id);
    }
  }
}
