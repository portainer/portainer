import _ from 'lodash';
import { ArrowRight } from 'lucide-react';

import { Icon } from '@@/Icon';
import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';
import { FormError } from '@@/form-components/FormError';
import { InputGroup } from '@@/form-components/InputGroup';
import { ItemProps } from '@@/form-components/InputList';
import { InputLabeled } from '@@/form-components/Input/InputLabeled';

import { Volume } from './types';
import { useInputContext } from './context';
import { VolumeSelector } from './VolumeSelector';

export function Item({
  item: volume,
  onChange,
  error,
  index,
}: ItemProps<Volume>) {
  const { allowBindMounts, allowAuto } = useInputContext();

  return (
    <div>
      <div className="col-sm-12 form-inline flex gap-1">
        <InputLabeled
          label="container"
          placeholder="e.g. /path/in/container"
          value={volume.containerPath}
          onChange={(e) => setValue({ containerPath: e.target.value })}
          size="small"
          className="flex-1"
          id={`container-path-${index}`}
          data-cy={`container-path_${index}`}
        />

        {allowBindMounts && (
          <InputGroup size="small">
            <ButtonSelector
              value={volume.type}
              onChange={(type) => {
                onChange({ ...volume, type, name: '' });
              }}
              options={[
                { value: 'volume', label: 'Volume' },
                { value: 'bind', label: 'Bind' },
              ]}
              aria-label="Volume type"
            />
          </InputGroup>
        )}
      </div>
      <div className="col-sm-12 form-inline mt-1 flex items-center gap-1">
        <Icon icon={ArrowRight} />
        {volume.type === 'volume' && (
          <InputGroup size="small" className="flex-1">
            <InputGroup.Addon as="label" htmlFor={`volume-${index}`}>
              volume
            </InputGroup.Addon>
            <VolumeSelector
              value={volume.name}
              onChange={(name) => setValue({ name })}
              inputId={`volume-${index}`}
              allowAuto={allowAuto}
            />
          </InputGroup>
        )}

        {volume.type === 'bind' && (
          <InputLabeled
            size="small"
            className="flex-1"
            label="host"
            placeholder="e.g. /path/on/host"
            value={volume.name}
            onChange={(e) => setValue({ name: e.target.value })}
            id={`host-path-${index}`}
            data-cy={`host-path_${index}`}
          />
        )}

        <InputGroup size="small">
          <ButtonSelector<boolean>
            aria-label="ReadWrite"
            value={volume.readOnly}
            onChange={(readOnly) => setValue({ readOnly })}
            options={[
              { value: false, label: 'Writable' },
              { value: true, label: 'Read-only' },
            ]}
          />
        </InputGroup>
      </div>
      {error && <FormError>{_.first(Object.values(error))}</FormError>}
    </div>
  );

  function setValue(partial: Partial<Volume>) {
    onChange({ ...volume, ...partial });
  }
}
