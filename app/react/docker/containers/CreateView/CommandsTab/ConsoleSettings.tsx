import { ReactNode } from 'react';
import { mixed } from 'yup';
import { ContainerConfig } from 'docker-types/generated/1.41';

import { FormControl } from '@@/form-components/FormControl';

const consoleSettingTypes = ['tty', 'interactive', 'both', 'none'] as const;

export type ConsoleSetting = (typeof consoleSettingTypes)[number];

export type ConsoleConfig = Pick<ContainerConfig, 'OpenStdin' | 'Tty'>;

export function ConsoleSettings({
  value,
  onChange,
}: {
  value: ConsoleSetting;
  onChange(value: ConsoleSetting): void;
}) {
  return (
    <FormControl label="Console" size="xsmall">
      <Item
        value="both"
        onChange={handleChange}
        label={
          <>
            Interactive & TTY <span className="small text-muted">(-i -t)</span>
          </>
        }
        selected={value}
      />
      <Item
        value="interactive"
        onChange={handleChange}
        label={
          <>
            Interactive <span className="small text-muted">(-i)</span>
          </>
        }
        selected={value}
      />
      <Item
        value="tty"
        onChange={handleChange}
        label={
          <>
            TTY <span className="small text-muted">(-t)</span>
          </>
        }
        selected={value}
      />
      <Item
        value="none"
        onChange={handleChange}
        label={<>None</>}
        selected={value}
      />
    </FormControl>
  );

  function handleChange(value: ConsoleSetting) {
    onChange(value);
  }
}

function Item({
  value,
  selected,
  onChange,
  label,
}: {
  value: ConsoleSetting;
  selected: ConsoleSetting;
  onChange(value: ConsoleSetting): void;
  label: ReactNode;
}) {
  return (
    <label className="radio-inline !m-0 w-1/2">
      <input
        type="radio"
        name="container_console"
        value={value}
        checked={value === selected}
        onChange={() => onChange(value)}
      />
      {label}
    </label>
  );
}

export function validation() {
  return mixed<ConsoleSetting>()
    .oneOf([...consoleSettingTypes])
    .default('none');
}
