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
  host: string;
  container: string;
  protocol: Protocol;
}

interface Props {
  value: PortMapping[];
  onChange(value: PortMapping[]): void;
  errors?: InputListError<PortMapping>[] | string;
}

export function PortsMappingField({ value, onChange, errors }: Props) {
  return (
    <>
      <InputList<PortMapping>
        label="Port mapping"
        value={value}
        onChange={onChange}
        addLabel="map additional port"
        itemBuilder={() => ({ host: '', container: '', protocol: 'TCP' })}
        item={Item}
        errors={errors}
      />
      {typeof errors === 'string' && (
        <div className="form-group col-md-12">
          <FormError>{errors}</FormError>
        </div>
      )}
    </>
  );
}

function Item({ onChange, item, error }: ItemProps<PortMapping>) {
  return (
    <div className={styles.item}>
      <div className={styles.inputs}>
        <InputGroup size="small">
          <InputGroup.Addon>host</InputGroup.Addon>
          <InputGroup.Input
            placeholder="e.g. 80"
            value={item.host}
            onChange={(e) => handleChange('host', e.target.value)}
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
            onChange={(e) => handleChange('container', e.target.value)}
          />
        </InputGroup>

        <ButtonSelector<Protocol>
          onChange={(value) => handleChange('protocol', value)}
          value={item.protocol}
          options={[{ value: 'TCP' }, { value: 'UDP' }]}
        />
      </div>
      {!!error && (
        <div className={styles.errors}>
          <FormError>{Object.values(error)[0]}</FormError>
        </div>
      )}
    </div>
  );

  function handleChange(name: string, value: string) {
    onChange({ ...item, [name]: value });
  }
}
