import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

import { Registry } from '@/react/portainer/registries/types';

import { Select } from '@@/form-components/ReactSelect';
import { FormControl } from '@@/form-components/FormControl';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';
import { SwitchField } from '@@/form-components/SwitchField';
import { TextTip } from '@@/Tip/TextTip';
import { FormSection } from '@@/form-components/FormSection';

interface Props {
  value?: number;
  registries: Registry[];
  onChange?: () => void;
  formInvalid?: boolean;
  errorMessage?: string;
  onSelect: (value?: number) => void;
  isActive?: boolean;
  clearRegistries?: () => void;
  method?: 'repository' | string;
}

export function PrivateRegistryFieldset({
  value,
  registries,
  onChange = () => {},
  formInvalid,
  errorMessage,
  onSelect,
  isActive,
  clearRegistries = () => {},
  method,
}: Props) {
  const [checked, setChecked] = useState(isActive || false);
  const [selected, setSelected] = useState(value);

  const tooltipMessage =
    'This allows you to provide credentials when using a private registry that requires authentication';

  useEffect(() => {
    if (checked) {
      onChange();
    } else {
      clearRegistries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  function reload() {
    onChange();
    setSelected(value);
  }

  return (
    <FormSection title="Registry">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={checked}
            onChange={(value) => setChecked(value)}
            tooltip={tooltipMessage}
            label="Use Credentials"
            labelClass="col-sm-3 col-lg-2"
            disabled={formInvalid}
          />
        </div>
      </div>

      {checked && (
        <>
          {method !== 'repository' && (
            <TextTip color="blue">
              If you make any changes to the image urls in your yaml, please
              reload or select registry manually
            </TextTip>
          )}

          {!errorMessage ? (
            <FormControl label="Registry" inputId="users-selector">
              <div className="flex">
                <Select
                  value={registries.filter(
                    (registry) => registry.Id === selected
                  )}
                  options={registries}
                  getOptionLabel={(registry) => registry.Name}
                  getOptionValue={(registry) => registry.Id.toString()}
                  onChange={(value) => onSelect(value?.Id)}
                  className="w-full"
                />
                {method !== 'repository' && (
                  <Button
                    onClick={reload}
                    title="Reload"
                    icon={RefreshCw}
                    color="light"
                  />
                )}
              </div>
            </FormControl>
          ) : (
            <FormError>{errorMessage}</FormError>
          )}
        </>
      )}
    </FormSection>
  );
}
