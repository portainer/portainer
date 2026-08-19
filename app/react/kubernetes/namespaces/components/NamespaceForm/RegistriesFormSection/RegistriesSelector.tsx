import { MultiValue } from 'react-select';

import { Registry } from '@/react/portainer/registries/types/registry';
import { useCurrentUser } from '@/react/hooks/useUser';

import { Select } from '@@/form-components/ReactSelect';
import { Link } from '@@/Link';

interface Props {
  value: MultiValue<Registry>;
  onChange(value: MultiValue<Registry>): void;
  options?: Registry[];
  inputId?: string;
  isEditingDisabled?: boolean;
}

export function RegistriesSelector({
  value,
  onChange,
  options = [],
  inputId,
  isEditingDisabled,
}: Props) {
  const { isPureAdmin } = useCurrentUser();

  if (options.length === 0) {
    return (
      <p className="text-muted mb-1 mt-2 text-xs">
        {isPureAdmin ? (
          <span>
            No registries available. Head over to the{' '}
            <Link
              to="portainer.registries"
              target="_blank"
              data-cy="namespace-permissions-registries-selector"
            >
              registry view
            </Link>{' '}
            to define a container registry.
          </span>
        ) : (
          <span>
            No registries available. Contact your administrator to create a
            container registry.
          </span>
        )}
      </p>
    );
  }

  if (isEditingDisabled) {
    return (
      <p className="text-muted mb-1 mt-2 text-xs">
        {value.length === 0 ? 'None' : value.map((v) => v.Name).join(', ')}
      </p>
    );
  }

  return (
    <Select
      isMulti
      getOptionLabel={(option) => option.Name}
      getOptionValue={(option) => String(option.Id)}
      options={options}
      value={value}
      closeMenuOnSelect={false}
      onChange={onChange}
      inputId={inputId}
      data-cy="namespaceCreate-registrySelect"
      id="namespaceCreate-registrySelect"
      placeholder="Select one or more registries"
      isDisabled={isEditingDisabled}
    />
  );
}
