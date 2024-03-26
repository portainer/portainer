import '@reach/combobox/styles.css';

import { useState, ChangeEvent } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
  ComboboxPopover,
} from '@reach/combobox';
import clsx from 'clsx';

import { useDebounce } from '@/react/hooks/useDebounce';
import { AutomationTestingProps } from '@/types';

import { Option } from '@@/form-components/PortainerSelect';

import styles from './AutocompleteSelect.module.css';

export function AutocompleteSelect({
  value,
  onChange,
  placeholder,
  searchResults,
  readOnly,
  inputId,
  'data-cy': dataCy,
}: {
  value: string;
  /**
   * onChange is called whenever the input is changed or an option is selected
   *
   * when the input is changed, the call is debounced
   */
  onChange(value: string): void;
  placeholder?: string;
  searchResults?: Option<string>[];
  readOnly?: boolean;
  inputId: string;
} & AutomationTestingProps) {
  const [searchTerm, setSearchTerm] = useDebounce(value, onChange);
  const [selected, setSelected] = useState(false);

  return (
    <Combobox
      className={styles.root}
      aria-label="compose"
      onSelect={onSelect}
      data-cy="component-gitComposeInput"
    >
      <ComboboxInput
        value={searchTerm}
        className="form-control"
        onChange={handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        id={inputId}
        autoComplete="off"
        data-cy={dataCy}
      />
      {!selected && searchResults && searchResults.length > 0 && (
        <ComboboxPopover>
          <ComboboxList>
            {searchResults.map((option: Option<string>) => (
              <ComboboxOption
                key={option.value}
                value={option.value}
                className={clsx(
                  `[&[aria-selected="true"]]:th-highcontrast:!bg-black [&[aria-selected="true"]]:th-dark:!bg-black`,
                  `hover:th-highcontrast:!bg-black hover:th-dark:!bg-black`,
                  'th-highcontrast:bg-gray-10 th-dark:bg-gray-10 '
                )}
              />
            ))}
          </ComboboxList>
        </ComboboxPopover>
      )}
    </Combobox>
  );

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    setSelected(false);
  }

  function onSelect(value: string) {
    onChange(value);
    setSelected(true);
  }
}
