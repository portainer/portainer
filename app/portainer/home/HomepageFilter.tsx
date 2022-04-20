import { components, OptionProps } from 'react-select';

import { Select } from '@/portainer/components/form-components/ReactSelect';
import { Filter } from '@/portainer/home/types';

interface Props {
  filterOptions: Filter[];
  onChange: (filterOptions: Filter[]) => void;
  placeHolder: string;
  value: Filter[];
}

function Option(props: OptionProps<Filter, true>) {
  const { isSelected, label } = props;
  return (
    <div>
      <components.Option
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        <input type="checkbox" checked={isSelected} onChange={() => null} />{' '}
        <label>{label}</label>
      </components.Option>
    </div>
  );
}

export function HomepageFilter({
  filterOptions,
  onChange,
  placeHolder,
  value,
}: Props) {
  return (
    <Select
      placeholder={placeHolder}
      options={filterOptions}
      value={value}
      isMulti
      components={{ Option }}
      onChange={(option) => onChange(option as Filter[])}
    />
  );
}
