import { Meta } from '@storybook/react';
import { useState } from 'react';

import { NumberInput, Select } from '../Input';

import { DefaultType, InputList } from './InputList';

const meta: Meta = {
  title: 'InputList',
  component: InputList,
};

export default meta;

export { Defaults, ListWithInputAndSelect };

function Defaults() {
  const [values, setValues] = useState<DefaultType[]>([{ value: '' }]);

  return (
    <InputList
      label="default example"
      value={values}
      onChange={(value) => setValues(value)}
    />
  );
}

interface ListWithSelectItem {
  value: number;
  select: string;
  id: number;
}

interface ListWithInputAndSelectArgs {
  label: string;
  movable: boolean;
  tooltip: string;
}
function ListWithInputAndSelect({
  label,
  movable,
  tooltip,
}: ListWithInputAndSelectArgs) {
  const [values, setValues] = useState<ListWithSelectItem[]>([
    { value: 0, select: '', id: 0 },
  ]);

  return (
    <InputList<ListWithSelectItem>
      label={label}
      onChange={setValues}
      value={values}
      item={SelectAndInputItem}
      itemKeyGetter={(item) => item.id}
      movable={movable}
      itemBuilder={() => ({ value: 0, select: '', id: values.length })}
      tooltip={tooltip}
    />
  );
}

ListWithInputAndSelect.args = {
  label: 'List with select and input',
  movable: false,
  tooltip: '',
};

function SelectAndInputItem({
  item,
  onChange,
}: {
  item: ListWithSelectItem;
  onChange: (value: ListWithSelectItem) => void;
}) {
  return (
    <div>
      <NumberInput
        value={item.value}
        onChange={(value: number) => onChange({ ...item, value })}
      />
      <Select
        onChange={(select: string) => onChange({ ...item, select })}
        options={[
          { label: 'option1', value: 'option1' },
          { label: 'option2', value: 'option2' },
        ]}
        value={item.select}
      />
    </div>
  );
}
