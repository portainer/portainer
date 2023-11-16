import { List, Plus } from 'lucide-react';

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
import { Widget } from '@@/Widget';
import { Button } from '@@/buttons';

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
    <Widget>
      <Widget.Title icon={List} title="Published ports">
        <Authorized authorizations="DockerServiceUpdate">
          <Button
            color="secondary"
            size="small"
            onClick={handleAdd}
            icon={Plus}
          >
            port mapping
          </Button>
        </Authorized>
      </Widget.Title>

      <Widget.Body className="!p-0">
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
      </Widget.Body>
    </Widget>
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
        <td />
        <td />
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
      value={value}
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
}

function getNumber(value: number) {
  return Number.isNaN(value) ? 0 : value;
}
