import { List, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { FormError } from '@@/form-components/FormError';
import {
  ArrayError,
  ItemProps,
  useInputList,
} from '@@/form-components/InputList/InputList';
import { InputLabeled } from '@@/form-components/Input/InputLabeled';
import { Table } from '@@/datatables';
import { Button } from '@@/buttons';
import { Select } from '@@/form-components/Input';

import { ServiceWidget } from '../ServiceWidget';

import { Protocol, Range, Value, isRange } from './types';

export type Values = Array<Value>;

export function PortsMappingField({
  value,
  onChange,
  errors,
  disabled,
  readOnly,
  hasChanges,
  onReset,
  onSubmit,
}: {
  value: Values;
  onChange(value: Values): void;
  errors?: ArrayError<Values>;
  disabled?: boolean;
  readOnly?: boolean;
  hasChanges: boolean;
  onReset(all?: boolean): void;
  onSubmit(): void;
}) {
  const { handleRemoveItem, handleAdd, handleChangeItem } = useInputList<Value>(
    {
      value,
      onChange,
      itemBuilder: () => ({
        hostPort: 0,
        containerPort: 0,
        protocol: 'tcp',
        publishMode: 'ingress',
      }),
    }
  );

  return (
    <ServiceWidget
      titleIcon={List}
      title="Published ports"
      labelForAddButton="port mapping"
      onAdd={handleAdd}
      hasChanges={hasChanges}
      onReset={onReset}
      onSubmit={onSubmit}
    >
      {value.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>Host port</th>
              <th>Container port</th>
              <th>Protocol</th>
              <th>Publish mode</th>
              <Authorized authorizations="DockerServiceUpdate">
                <th>Actions</th>
              </Authorized>
            </tr>
          </thead>

          <tbody>
            {value.map((item, index) => (
              <Item
                key={index}
                item={item}
                index={index}
                onChange={(value) => handleChangeItem(index, value)}
                error={errors?.[index]}
                disabled={disabled}
                readOnly={readOnly}
                onRemove={() => handleRemoveItem(index, item)}
              />
            ))}
          </tbody>
        </Table>
      ) : (
        <p>This service has no ports published.</p>
      )}
      {typeof errors === 'string' && (
        <div className="form-group col-md-12">
          <FormError>{errors}</FormError>
        </div>
      )}
    </ServiceWidget>
  );
}

function Item({
  onChange,
  item,
  error,
  disabled,
  readOnly,
  onRemove,
  index,
}: ItemProps<Value> & { onRemove(): void }) {
  return (
    <>
      <tr>
        <td>
          <RangeOrInput
            value={item.hostPort}
            onChange={(value) => handleChange('hostPort', value)}
            id={`hostPort-${index}`}
            label="host"
          />
        </td>
        <td>
          <RangeOrInput
            value={item.containerPort}
            onChange={(value) => handleChange('containerPort', value)}
            id={`containerPort-${index}`}
            label="container"
          />
        </td>
        <td>
          <ButtonSelector<Protocol>
            onChange={(value) => handleChange('protocol', value)}
            value={item.protocol}
            options={[{ value: 'tcp' }, { value: 'udp' }]}
            disabled={disabled}
            readOnly={readOnly}
          />
        </td>
        <td>
          <Select
            onChange={(e) => handleChange('publishMode', e.target.value)}
            value={item.publishMode}
            options={[
              { value: 'ingress', label: 'ingress' },
              { value: 'host', label: 'host' },
            ]}
            disabled={disabled}
          />
        </td>
        <td>
          <Button
            icon={Trash2}
            color="dangerlight"
            onClick={() => onRemove()}
          />
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5}>
            <FormError>{error}</FormError>
          </td>
        </tr>
      )}
    </>
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
      value={value || ''}
      type="number"
      onChange={(e) => onChange(getNumber(e.target.valueAsNumber))}
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
    <div className="flex items-center gap-2">
      <label className="font-normal">{label}</label>
      <InputLabeled
        label="from"
        size="small"
        value={value.start || ''}
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
        value={value.end || ''}
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
}

function getNumber(value: number) {
  return Number.isNaN(value) ? 0 : value;
}
