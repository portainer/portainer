import { useField } from 'formik';
import _ from 'lodash';

import { Select } from '@@/form-components/ReactSelect';
import {
  Option,
  Option as OptionType,
} from '@@/form-components/PortainerSelect';

export function CreatableSelector({
  name,
  options,
  onCreate,
  isLoading,
}: {
  name: string;
  options: Array<OptionType<number>>;
  onCreate: (label: string) => Promise<number>;
  isLoading: boolean;
}) {
  const [{ onBlur, value }, , { setValue }] = useField<Array<number>>(name);

  const selectedValues = value.reduce(
    (acc: Array<OptionType<number>>, cur) =>
      _.compact([...acc, findOption(cur, options)]),
    []
  );

  return (
    <Select
      isCreatable
      options={options}
      value={
        isLoading
          ? [...selectedValues, { label: 'Creating...', value: 0 }]
          : selectedValues
      }
      isMulti
      onCreateOption={handleCreate}
      onChange={handleChange}
      onBlur={onBlur}
      isLoading={isLoading}
      isDisabled={isLoading}
      closeMenuOnSelect={false}
    />
  );

  async function handleCreate(label: string) {
    const id = await onCreate(label);
    setValue([...value, id]);
  }

  function handleChange(value: ReadonlyArray<{ value: number }>) {
    setValue(value.map((v) => v.value));
  }
}

function findOption<T>(option: T, options: Array<Option<T>>) {
  return options.find((t) => t.value === option);
}
