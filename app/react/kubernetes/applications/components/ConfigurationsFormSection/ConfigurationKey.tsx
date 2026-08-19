import clsx from 'clsx';
import { RotateCw, List } from 'lucide-react';
import { FormikErrors } from 'formik';

import { InputGroup } from '@@/form-components/InputGroup';
import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';
import { isArrayErrorType } from '@@/form-components/formikUtils';

import { ConfigurationOverrideKey, ConfigurationType } from './types';

type Props = {
  value: ConfigurationOverrideKey;
  onChange: (value: ConfigurationOverrideKey) => void;
  configurationIndex: number;
  keyIndex: number;
  overrideKeysErrors?:
    | string
    | string[]
    | FormikErrors<ConfigurationOverrideKey>[];
  configurationType: ConfigurationType;
};

export function ConfigurationData({
  value,
  onChange,
  overrideKeysErrors,
  configurationIndex,
  keyIndex,
  configurationType,
}: Props) {
  const dataCyType = configurationType.toLowerCase();

  // rule out the error (from formik) being of type string
  const overriddenKeyError = isArrayErrorType(overrideKeysErrors)
    ? overrideKeysErrors[keyIndex]
    : undefined;
  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
      <InputGroup size="small" className="min-w-[250px]">
        <InputGroup.Addon>Key</InputGroup.Addon>
        <InputGroup.Input
          type="text"
          value={value.key}
          disabled
          data-cy={`k8sAppCreate-${dataCyType}KeyInput_${configurationIndex}_${keyIndex}`}
        />
      </InputGroup>
      <InputGroup size="small">
        <InputGroup.ButtonWrapper>
          <Button
            color="light"
            size="medium"
            className={clsx('!ml-0', { active: value.type === 'ENVIRONMENT' })}
            onClick={() =>
              onChange({
                ...value,
                path: '',
                type: 'ENVIRONMENT',
              })
            }
            icon={RotateCw}
            data-cy={`k8sAppCreate-${dataCyType}AutoButton_${configurationIndex}_${keyIndex}`}
          >
            Environment
          </Button>
          <Button
            color="light"
            size="medium"
            className={clsx('!ml-0 mr-1', {
              active: value.type === 'FILESYSTEM',
            })}
            onClick={() => onChange({ ...value, path: '', type: 'FILESYSTEM' })}
            icon={List}
            data-cy={`k8sAppCreate-${dataCyType}OverrideButton_${configurationIndex}_${keyIndex}`}
          >
            File system
          </Button>
        </InputGroup.ButtonWrapper>
      </InputGroup>

      {value.type === 'FILESYSTEM' && (
        <div>
          <InputGroup size="small" className="min-w-[250px]">
            <InputGroup.Addon required>Path on disk</InputGroup.Addon>
            <InputGroup.Input
              type="text"
              value={value.path}
              placeholder="e.g. /etc/myapp/conf.d"
              onChange={(e) => onChange({ ...value, path: e.target.value })}
              data-cy={`k8sAppCreate-${dataCyType}PathOnDiskInput_${configurationIndex}_${keyIndex}`}
            />
          </InputGroup>
          {overriddenKeyError?.path && (
            <FormError>{overriddenKeyError.path}</FormError>
          )}
        </div>
      )}
    </div>
  );
}
