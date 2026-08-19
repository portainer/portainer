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
import { TextTip } from '@@/Tip/TextTip';

import {
  ConfigurationFormValues,
  ConfigurationOverrideKey,
  ConfigurationType,
} from './types';
import { ConfigurationData } from './ConfigurationKey';

type Props = {
  item: ConfigurationFormValues;
  onChange: (values: ConfigurationFormValues) => void;
  onRemoveItem: () => void;
  configurations: Array<ConfigMap | Secret>;
  index: number;
  error?: ItemError<ConfigurationFormValues>;
  configurationType: ConfigurationType;
};

export function ConfigurationItem({
  item,
  onChange,
  error,
  configurations,
  index,
  onRemoveItem,
  configurationType,
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
              data-cy={`k8sAppCreate-add${configurationType}Select_${index}`}
              id={`k8sAppCreate-add${configurationType}Select_${index}`}
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
              data-cy={`k8sAppCreate-add${configurationType}AutoButton_${index}`}
            >
              Auto
            </Button>
            <Button
              color="light"
              size="medium"
              className={clsx('!ml-0 mr-1', { active: item.overriden })}
              onClick={() => onToggleOverride(true)}
              icon={List}
              data-cy={`k8sAppCreate-add${configurationType}OverrideButton_${index}`}
            >
              Override
            </Button>
          </InputGroup.ButtonWrapper>
        </InputGroup>
        <Button
          color="dangerlight"
          size="medium"
          onClick={onRemoveItem}
          className="vertical-center btn-only-icon !ml-0"
          icon={Trash2}
          data-cy={`k8sAppCreate-remove${configurationType}Button_${index}`}
        />
      </div>
      {!item.overriden && (
        <TextTip color="blue">
          The following keys will be loaded from the{' '}
          <code>{item.selectedConfiguration.metadata?.name}</code>{' '}
          {configurationType} as environment variables:
          {Object.keys(configurationData).map((key, index) => (
            <span key={key}>
              <code>{key}</code>
              {index < Object.keys(configurationData).length - 1 ? ', ' : ''}
            </span>
          ))}
        </TextTip>
      )}
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
            configurationType={configurationType}
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
