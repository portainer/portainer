import _ from 'lodash';

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
  dataCy?: string;
  inputId?: string;
  placeholder?: string;
}

export function NamespacesSelector({
  name,
  value,
  onChange,
  namespaces,
  dataCy,
  inputId,
  placeholder,
}: Props) {
  return (
    <Select
      name={name}
      isMulti
      getOptionLabel={(namespace) => namespace.name}
      getOptionValue={(namespace) => String(namespace.id)}
      options={namespaces}
      value={_.compact(
        value.map((namespaceName) =>
          namespaces.find((namespace) => namespace.name === namespaceName)
        )
      )}
      closeMenuOnSelect={false}
      onChange={(selectedTeams) =>
        onChange(selectedTeams.map((namespace) => namespace.name))
      }
      data-cy={dataCy}
      inputId={inputId}
      placeholder={placeholder}
    />
  );
}
