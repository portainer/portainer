import { Database, Globe } from 'lucide-react';
import { FormikErrors } from 'formik';
import { PropsWithChildren } from 'react';

import { Button } from '@@/buttons';

import { SimpleForm } from './SimpleForm';
import { Values } from './types';
import { AdvancedForm } from './AdvancedForm';
import { RateLimits } from './RateLimits';

export function ImageConfigFieldset({
  values,
  onChange,
  errors,
  checkRateLimits,
  children,
  autoComplete,
  setValidity,
}: PropsWithChildren<{
  values: Values;
  onChange: (values: Values) => void;
  checkRateLimits?: boolean;
  errors?: FormikErrors<Values>;
  autoComplete?: boolean;
  setValidity: (error?: string) => void;
}>) {
  const Component = values.useRegistry ? SimpleForm : AdvancedForm;

  return (
    <div className="row">
      <Component
        values={values}
        onChange={onChange}
        errors={errors}
        autoComplete={autoComplete}
      />

      <div className="form-group">
        <div className="col-sm-12">
          {values.useRegistry ? (
            <Button
              size="small"
              color="link"
              icon={Globe}
              className="!ml-0 p-0 hover:no-underline"
              onClick={() => handleChange({ useRegistry: false })}
            >
              Advanced mode
            </Button>
          ) : (
            <Button
              size="small"
              color="link"
              icon={Database}
              className="!ml-0 p-0 hover:no-underline"
              onClick={() => handleChange({ useRegistry: true })}
            >
              Simple mode
            </Button>
          )}
        </div>
      </div>

      {children}

      {checkRateLimits && values.useRegistry && (
        <RateLimits registryId={values.registryId} setValidity={setValidity} />
      )}
    </div>
  );

  function handleChange(newValues: Partial<Values>) {
    onChange({ ...values, ...newValues });
  }
}
