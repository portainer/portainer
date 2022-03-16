import { ButtonSelector } from '@/portainer/components/form-components/ButtonSelector/ButtonSelector';
import { FormError } from '@/portainer/components/form-components/FormError';
import { InputGroup } from '@/portainer/components/form-components/InputGroup';
import { InputList } from '@/portainer/components/form-components/InputList';
import {
  InputListError,
  ItemProps,
} from '@/portainer/components/form-components/InputList/InputList';

import styles from './PortsMappingField.module.css';

type Protocol = 'TCP' | 'UDP';

export interface PortMapping {
  host?: number;
  container?: number;
  protocol: Protocol;
}

interface Props {
  value: PortMapping[];
  onChange?(value: PortMapping[]): void;
  errors?: InputListError<PortMapping>;
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
      <InputList<PortMapping>
        label="Port mapping"
        value={value}
        onChange={onChange}
        addLabel="map additional port"
        itemBuilder={() => ({
          host: 0,
          container: 0,
          protocol: 'TCP',
        })}
        item={Item}
        errors={errors}
        disabled={disabled}
        readOnly={readOnly}
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
}: ItemProps<PortMapping>) {
  return (
    <div className={styles.item}>
      <div className={styles.inputs}>
        <InputGroup size="small">
          <InputGroup.Addon>host</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. 80"
            value={item.host}
            onChange={(e) =>
              handleChange('host', parseInt(e.target.value || '0', 10))
            }
            disabled={disabled}
            readOnly={readOnly}
            type="number"
          />
        </InputGroup>

        <span style={{ margin: '0 10px 0 10px' }}>
          <i className="fa fa-long-arrow-alt-right" aria-hidden="true" />
        </span>

        <InputGroup size="small">
          <InputGroup.Addon>container</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. 80"
            value={item.container}
            onChange={(e) =>
              handleChange('container', parseInt(e.target.value || '0', 10))
            }
            disabled={disabled}
            readOnly={readOnly}
            type="number"
          />
        </InputGroup>

        <ButtonSelector<Protocol>
          onChange={(value) => handleChange('protocol', value)}
          value={item.protocol}
          options={[{ value: 'TCP' }, { value: 'UDP' }]}
          disabled={disabled}
          readOnly={readOnly}
        />
      </div>
      {!!error && (
        <div className={styles.errors}>
          <FormError>{Object.values(error)[0]}</FormError>
        </div>
      )}
    </div>
  );

  function handleChange(name: keyof PortMapping, value: string | number) {
    onChange({ ...item, [name]: value });
  }
}
