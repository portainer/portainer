import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { ItemProps } from '@@/form-components/InputList';

import { Label } from './types';

export function Item({ item, onChange, error, index }: ItemProps<Label>) {
  return (
    <div className="w-full">
      <div className="flex w-full gap-4">
        <InputGroup className="w-1/2">
          <InputGroup.Addon>name</InputGroup.Addon>
          <InputGroup.Input
            value={item.name}
            data-cy={`label-name_${index}`}
            onChange={(e) => onChange({ ...item, name: e.target.value })}
            placeholder="e.g. com.example.foo"
          />
        </InputGroup>
        <InputGroup className="w-1/2">
          <InputGroup.Addon>value</InputGroup.Addon>
          <InputGroup.Input
            value={item.value}
            data-cy={`label-value${index}`}
            onChange={(e) => onChange({ ...item, value: e.target.value })}
            placeholder="e.g. bar"
          />
        </InputGroup>
      </div>
      {error && <FormError>{Object.values(error)[0]}</FormError>}
    </div>
  );
}
