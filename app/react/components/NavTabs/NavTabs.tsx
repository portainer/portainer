import clsx from 'clsx';
import { ComponentProps, ReactNode } from 'react';

import { Button } from '@@/buttons';

import styles from './NavTabs.module.css';

export interface Option<T extends string | number = string> {
  label: ReactNode;
  children?: ReactNode;
  id: T;
  hidden?: boolean;
  icon?: ComponentProps<typeof Button>['icon'];
}

interface Props<T extends string | number> {
  options: Array<Option<T>> | ReadonlyArray<Option<T>>;
  selectedId?: T;
  onSelect?(id: T): void;
  disabled?: boolean;
  type?: 'tabs' | 'pills';
  justified?: boolean;
}

export function NavTabs<T extends string | number = string>({
  options,
  selectedId,
  onSelect = () => {},
  disabled,
  type = 'tabs',
  justified = false,
}: Props<T>) {
  const selected = options.find((option) => option.id === selectedId);

  return (
    <div>
      <ul
        className={clsx('nav', `nav-${type}`, { 'nav-justified': justified })}
      >
        {options.map(
          (option) =>
            !option.hidden && (
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
                <Button
                  color="none"
                  onClick={() => handleSelect(option)}
                  as="a"
                  data-cy="nav-tab-button"
                  className="!flex"
                  icon={option.icon}
                >
                  {option.label}
                </Button>
              </li>
            )
        )}
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

    onSelect(option.id);
  }
}
