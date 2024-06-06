import { List, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { FormError } from '@@/form-components/FormError';
import {
  ArrayError,
  ItemProps,
  useInputList,
} from '@@/form-components/InputList/InputList';
import { Table } from '@@/datatables';
import { Button } from '@@/buttons';
import { Select } from '@@/form-components/Input';

import { ServiceWidget } from '../ServiceWidget';

import { Protocol, Value } from './types';
import { RangeOrNumberField } from './RangeOrNumberField';

export type Values = Array<Value>;

export function PortsMappingField({
  values,
  onChange,
  errors,
  disabled,
  readOnly,
  hasChanges,
  onReset,
  onSubmit,
}: {
  values: Values;
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
      value: values,
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
      isValid={!errors}
    >
      {values.length > 0 ? (
        <Table data-cy="service-published-ports-table">
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
            {values.map((item, index) => (
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
        <p className="p-5">This service has no ports published.</p>
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
          <div className="flex gap-2 items-center">
            <RangeOrNumberField
              value={item.hostPort}
              onChange={(value) => handleChange('hostPort', value)}
              id={`hostPort-${index}`}
              label="host"
              data-cy={`hostPort-${index}`}
            />
          </div>
        </td>
        <td>
          <RangeOrNumberField
            value={item.containerPort}
            onChange={(value) => handleChange('containerPort', value)}
            id={`containerPort-${index}`}
            label="container"
            data-cy={`containerPort-${index}`}
          />
        </td>
        <td>
          <ButtonSelector<Protocol>
            onChange={(value) => handleChange('protocol', value)}
            value={item.protocol}
            options={[{ value: 'tcp' }, { value: 'udp' }]}
            disabled={disabled}
            readOnly={readOnly}
            aria-label="protocol selector"
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
            aria-label="publish mode"
            data-cy={`publishMode-${index}`}
          />
        </td>
        <td>
          <Button
            icon={Trash2}
            color="dangerlight"
            onClick={() => onRemove()}
            data-cy={`remove-port-${index}`}
          />
        </td>
      </tr>
      {error && (
        <tr>
          {typeof error === 'string' ? (
            <td colSpan={5}>
              <FormError>{error}</FormError>
            </td>
          ) : (
            <>
              <td>
                <FormError>{rangeError(error.hostPort)}</FormError>
              </td>
              <td>
                <FormError>{rangeError(error.containerPort)}</FormError>
              </td>
              <td>
                <FormError>{error.protocol}</FormError>
              </td>
              <td>
                <FormError>{error.publishMode}</FormError>
              </td>
            </>
          )}
        </tr>
      )}
    </>
  );

  function handleChange(name: keyof Value, value: unknown) {
    onChange({ ...item, [name]: value });
  }

  function rangeError(error?: string | { start?: string; end?: string }) {
    if (!error) {
      return null;
    }

    if (typeof error === 'string') {
      return error;
    }

    return error.start || error.end;
  }
}
