import clsx from 'clsx';
import { List, RotateCw, Trash2 } from 'lucide-react';
import { ConfigMap, Secret } from 'kubernetes-types/core/v1';
import { SingleValue } from 'react-select';

import { InputGroup } from '@@/form-components/InputGroup';
import { Select } from '@@/form-components/ReactSelect';
import { FormError } from '@@/form-components/FormError';
import { ItemError } from '@@/form-components/InputList/InputList';
import { isErrorType } from '@@/form-components/formikUtils';
import { Button } from '@@/buttons';

import { ConfigurationFormValues, ConfigurationOverrideKey } from './types';
import { ConfigurationData } from './ConfigurationKey';

type Props = {
  item: ConfigurationFormValues;
  onChange: (values: ConfigurationFormValues) => void;
  onRemoveItem: () => void;
  configurations: Array<ConfigMap | Secret>;
  index: number;
  error?: ItemError<ConfigurationFormValues>;
  dataCyType: 'config' | 'secret';
};

export function ConfigurationItem({
  item,
  onChange,
  error,
  configurations,
  index,
  onRemoveItem,
  dataCyType,
}: Props) {
  // rule out the error being of type string
  const formikError = isErrorType(error) ? error : undefined;
  const configurationData = item.selectedConfiguration.data || {};

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-start gap-x-2 gap-y-2">
        <div>
          <InputGroup size="small" className="min-w-[250px]">
            <InputGroup.Addon>Name</InputGroup.Addon>
            <Select
              options={configurations}
              isMulti={false}
              getOptionLabel={(option) => option.metadata?.name || ''}
              noOptionsMessage={() => 'No ConfigMaps found.'}
              value={configurations.find(
                (configuration) =>
                  configuration.metadata?.name ===
                  item.selectedConfiguration.metadata?.name
              )}
              onChange={onSelectConfigMap}
              size="sm"
              data-cy={`k8sAppCreate-add${dataCyType}Select_${index}`}
            />
          </InputGroup>
          {formikError?.selectedConfiguration && (
            <FormError>{formikError?.selectedConfiguration}</FormError>
          )}
        </div>
        <InputGroup size="small">
          <InputGroup.ButtonWrapper>
            <Button
              color="light"
              size="medium"
              className={clsx('!ml-0', { active: !item.overriden })}
              onClick={() => onToggleOverride(false)}
              icon={RotateCw}
            >
              Auto
            </Button>
            <Button
              color="light"
              size="medium"
              className={clsx('!ml-0 mr-1', { active: item.overriden })}
              onClick={() => onToggleOverride(true)}
              icon={List}
            >
              Override
            </Button>
          </InputGroup.ButtonWrapper>
        </InputGroup>
        <Button
          color="dangerlight"
          size="medium"
          onClick={() => onRemoveItem()}
          className="!ml-0 vertical-center btn-only-icon"
          icon={Trash2}
        />
      </div>
      {item.overriden &&
        item.overridenKeys.map((overridenKey, keyIndex) => (
          <ConfigurationData
            key={overridenKey.key}
            value={overridenKey}
            onChange={(value: ConfigurationOverrideKey) => {
              const newOverridenKeys = [...item.overridenKeys];
              newOverridenKeys[keyIndex] = value;
              onChange({ ...item, overridenKeys: newOverridenKeys });
            }}
            overrideKeysErrors={formikError?.overridenKeys}
            dataCyType={dataCyType}
            configurationIndex={index}
            keyIndex={keyIndex}
          />
        ))}
    </div>
  );

  function onSelectConfigMap(configMap: SingleValue<ConfigMap | Secret>) {
    if (configMap) {
      onChange({
        ...item,
        overriden: false,
        selectedConfiguration: configMap,
        overridenKeys: Object.keys(configMap.data || {}).map((key) => ({
          key,
          path: '',
          type: 'NONE',
        })),
      });
    }
  }

  function onToggleOverride(overriden: boolean) {
    onChange({
      ...item,
      overriden,
      overridenKeys: Object.keys(configurationData).map((key) => ({
        key,
        path: '',
        type: overriden ? 'ENVIRONMENT' : 'NONE',
      })),
    });
  }
}
