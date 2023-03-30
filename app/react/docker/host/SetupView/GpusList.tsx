import { array, object, string } from 'yup';

import { r2a } from '@/react-tools/react2angular';
import { withControlledInput } from '@/react-tools/withControlledInput';

import { InputList } from '@@/form-components/InputList';
import { ItemProps } from '@@/form-components/InputList/InputList';
import { InputGroup } from '@@/form-components/InputGroup';

export interface Gpu {
  value: string;
  name: string;
}

interface Props {
  value: Gpu[];
  onChange(value: Gpu[]): void;
}

function Item({ item, onChange }: ItemProps<Gpu>) {
  return (
    <div className="flex flex-grow gap-2">
      <InputGroup size="small" className="flex-grow">
        <InputGroup.Addon>GPU Name</InputGroup.Addon>
        <InputGroup.Input
          placeholder="my-gpu"
          value={item.name}
          onChange={(e) => {
            onChange({ ...item, name: e.target.value });
          }}
        />
      </InputGroup>

      <InputGroup size="small" className="flex-grow">
        <InputGroup.Addon>Index or UUID</InputGroup.Addon>
        <InputGroup.Input
          placeholder="0 or GPU-6e2c7185-c3d3-ae22-da43-bc5267b89061"
          value={item.value}
          onChange={(e) => {
            onChange({ ...item, value: e.target.value });
          }}
        />
      </InputGroup>
    </div>
  );
}

export function GpusList({ value, onChange }: Props) {
  return (
    <InputList<Gpu>
      label="GPUs"
      tooltip="You may optionally set up the GPUs that will be selectable against containers, although 'All GPUs' will always be available."
      value={value}
      onChange={onChange}
      itemBuilder={() => ({ value: '', name: '' })}
      addLabel="Add GPU"
      item={Item}
    />
  );
}

export function gpusListValidation() {
  const gpuShape = object().shape({
    name: string().required(),
    value: string().required(),
  });
  return array().of(gpuShape).default([]);
}

export const GpusListAngular = r2a(withControlledInput(GpusList), [
  'value',
  'onChange',
]);
