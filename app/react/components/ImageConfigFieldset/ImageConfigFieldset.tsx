import { Database, Globe } from 'lucide-react';
import { FormikErrors } from 'formik';
import { PropsWithChildren } from 'react';

import { Button } from '@@/buttons';

import { SimpleForm } from './SimpleForm';
import { Values } from './types';
import { AdvancedForm } from './AdvancedForm';
import { RateLimits } from './RateLimits';

export function ImageConfigFieldset({
  onRateLimit,
  children,
  autoComplete,
  values,
  errors,
  onChangeImage,
  setFieldValue,
}: PropsWithChildren<{
  values: Values;
  errors?: FormikErrors<Values>;
  autoComplete?: boolean;
  onRateLimit?: (limited?: boolean) => void;
  onChangeImage?: (name: string) => void;
  setFieldValue: <T>(field: string, value: T) => void;
}>) {
  const Component = values.useRegistry ? SimpleForm : AdvancedForm;

  return (
    <div className="row">
      <Component
        autoComplete={autoComplete}
        values={values}
        errors={errors}
        onChangeImage={onChangeImage}
        setFieldValue={setFieldValue}
      />

      <div className="form-group">
        <div className="col-sm-12">
          {values.useRegistry ? (
            <Button
              size="small"
              color="link"
              icon={Globe}
              className="!ml-0 p-0 hover:no-underline"
              onClick={() => setFieldValue('useRegistry', false)}
              data-cy="image-config-advanced-button"
            >
              Advanced mode
            </Button>
          ) : (
            <Button
              size="small"
              color="link"
              icon={Database}
              className="!ml-0 p-0 hover:no-underline"
              onClick={() => setFieldValue('useRegistry', true)}
              data-cy="image-config-simple-button"
            >
              Simple mode
            </Button>
          )}
        </div>
      </div>

      {children}

      {onRateLimit && values.useRegistry && (
        <RateLimits registryId={values.registryId} onRateLimit={onRateLimit} />
      )}
    </div>
  );
}
