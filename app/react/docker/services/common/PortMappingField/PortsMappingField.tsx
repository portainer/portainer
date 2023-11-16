import { ArrowRight } from 'lucide-react';

import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { FormError } from '@@/form-components/FormError';
import { InputList } from '@@/form-components/InputList';
import { ArrayError, ItemProps } from '@@/form-components/InputList/InputList';
import { Icon } from '@@/Icon';
import { InputLabeled } from '@@/form-components/Input/InputLabeled';

import { Protocol, Range, Value, isRange } from './types';

export type Values = Array<Value>;

interface Props {
  value: Values;
  onChange?(value: Values): void;
  errors?: ArrayError<Values>;
  disabled?: boolean;
  readOnly?: boolean;
}

export function PortsMappingField({
  value,
  onChange = () => {},
  errors,
  disabled,
  readOnly,
}: Props) {
  return (
    <>
      <InputList<Value>
        label="Port mapping"
        value={value}
        onChange={onChange}
        addLabel="map additional port"
        itemBuilder={() => ({
          hostPort: 0,
          containerPort: 0,
          protocol: 'tcp',
          publishMode: 'ingress',
        })}
        item={Item}
        errors={errors}
        disabled={disabled}
        readOnly={readOnly}
        tooltip="When a range of ports on the host and a single port on the container is specified, Docker will randomly choose a single available port in the defined range and forward that to the container port."
      />
      {typeof errors === 'string' && (
        <div className="form-group col-md-12">
          <FormError>{errors}</FormError>
        </div>
      )}
    </>
  );
}

function Item({
  onChange,
  item,
  error,
  disabled,
  readOnly,
  index,
}: ItemProps<Value>) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <RangeOrInput
          value={item.hostPort}
          onChange={(value) => handleChange('hostPort', value)}
          id={`hostPort-${index}`}
          label="Host"
        />

        <span className="mx-3">
          <Icon icon={ArrowRight} />
        </span>
        <RangeOrInput
          value={item.hostPort}
          onChange={(value) => handleChange('containerPort', value)}
          id={`containerPort-${index}`}
          label="Container"
        />

        <ButtonSelector<Protocol>
          onChange={(value) => handleChange('protocol', value)}
          value={item.protocol}
          options={[{ value: 'tcp' }, { value: 'udp' }]}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
      {!!error && <FormError>{Object.values(error)[0]}</FormError>}
    </div>
  );

  function handleChange(name: keyof Value, value: unknown) {
    onChange({ ...item, [name]: value });
  }
}

function RangeOrInput({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  label,
}: {
  value: Range | number | undefined;
  onChange: (value: Range | number | undefined) => void;
  disabled?: boolean;
  readOnly?: boolean;
  id: string;
  label: string;
}) {
  if (isRange(value)) {
    return (
      <RangeInput
        value={value}
        onChange={onChange}
        label={label}
        disabled={disabled}
        readOnly={readOnly}
        id={id}
      />
    );
  }

  return (
    <InputLabeled
      size="small"
      placeholder="e.g. 80"
      className="w-1/2"
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      id={id}
    />
  );
}

function RangeInput({
  value,
  onChange,
  disabled,
  readOnly,
  id,
  label,
}: {
  value: Range;
  onChange: (value: Range) => void;
  disabled?: boolean;
  readOnly?: boolean;
  id: string;
  label: string;
}) {
  return (
    <div>
      <label>{label}</label>
      <InputLabeled
        label="from"
        size="small"
        value={value.start}
        onChange={(e) =>
          handleChange({ start: getNumber(e.target.valueAsNumber) })
        }
        disabled={disabled}
        readOnly={readOnly}
        id={id}
        type="number"
      />

      <InputLabeled
        label="to"
        size="small"
        value={value.end}
        onChange={(e) =>
          handleChange({ end: getNumber(e.target.valueAsNumber) })
        }
        disabled={disabled}
        readOnly={readOnly}
        id={id}
      />
    </div>
  );

  function handleChange(range: Partial<Range>) {
    onChange({ ...value, ...range });
  }

  function getNumber(value: number) {
    return Number.isNaN(value) ? 0 : value;
  }
}
