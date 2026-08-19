import { RefreshCw } from 'lucide-react';

import { Registry } from '@/react/portainer/registries/types/registry';

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
  onReload?: () => void;
  formInvalid?: boolean;
  errorMessage?: string;
  onChange: (value?: number) => void;
  method?: 'repository' | string;
}

export const REGISTRY_CREDENTIALS_ENABLED = -1;

export function PrivateRegistryFieldset({
  value,
  registries,
  onReload,
  formInvalid,
  errorMessage,
  onChange,
  method,
}: Props) {
  const tooltipMessage =
    'This allows you to provide credentials when using a private registry that requires authentication';

  const isActive = !!value;

  return (
    <FormSection title="Registry">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={isActive}
            onChange={handleCheckChange}
            tooltip={tooltipMessage}
            label="Use Credentials"
            labelClass="col-sm-3 col-lg-2"
            disabled={formInvalid}
            data-cy="private-registry-use-credentials-switch"
          />
        </div>
      </div>

      {isActive && (
        <>
          {method !== 'repository' && (
            <TextTip color="blue">
              If you make any changes to the image urls in your yaml, please
              reload or select registry manually
            </TextTip>
          )}

          {!errorMessage ? (
            <FormControl label="Registry" inputId="private-registry-selector">
              <div className="flex">
                <Select
                  value={registries.filter((registry) => registry.Id === value)}
                  options={registries}
                  getOptionLabel={(registry) => registry.Name}
                  getOptionValue={(registry) => registry.Id.toString()}
                  onChange={(value) => onChange(value?.Id)}
                  className="w-full"
                  data-cy="private-registry-selector"
                  inputId="private-registry-selector"
                />
                {method !== 'repository' && onReload && (
                  <Button
                    onClick={onReload}
                    title="Reload"
                    icon={RefreshCw}
                    color="light"
                    data-cy="private-registry-reload-button"
                    aria-label="Reload"
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

  function handleCheckChange(checked: boolean) {
    onChange(checked ? REGISTRY_CREDENTIALS_ENABLED : undefined);
  }
}
