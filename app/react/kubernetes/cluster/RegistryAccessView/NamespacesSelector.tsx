import _ from 'lodash';
import { useMemo } from 'react';

import { Select } from '@@/form-components/ReactSelect';

interface Namespace {
  id: string;
  name: string;
}

interface Props {
  name?: string;
  value: string[];
  onChange(value: string[]): void;
  namespaces: Namespace[];
  dataCy: string;
  inputId?: string;
  placeholder?: string;
  allowSelectAll?: boolean;
}

export function NamespacesSelector({
  name,
  value,
  onChange,
  namespaces,
  dataCy,
  inputId,
  placeholder,
  allowSelectAll,
}: Props) {
  const options = useMemo(() => {
    if (allowSelectAll) {
      return [{ id: 'all', name: 'Select all' }, ...namespaces];
    }
    return namespaces;
  }, [namespaces, allowSelectAll]);
  return (
    <Select
      name={name}
      isMulti
      getOptionLabel={(namespace) => namespace.name}
      getOptionValue={(namespace) => String(namespace.id)}
      options={options}
      value={_.compact(
        value.map((namespaceName) =>
          namespaces.find((namespace) => namespace.name === namespaceName)
        )
      )}
      closeMenuOnSelect={false}
      onChange={(selectedNamespaces) => {
        if (selectedNamespaces.some((namespace) => namespace.id === 'all')) {
          onChange(namespaces.map((namespace) => namespace.name));
        } else {
          onChange(selectedNamespaces.map((namespace) => namespace.name));
        }
      }}
      data-cy={dataCy}
      id={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
