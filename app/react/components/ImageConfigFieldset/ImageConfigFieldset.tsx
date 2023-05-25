import { Database, Globe } from 'lucide-react';
import { FormikErrors, useFormikContext } from 'formik';
import { PropsWithChildren } from 'react';

import { Button } from '@@/buttons';

import { SimpleForm } from './SimpleForm';
import { Values } from './types';
import { AdvancedForm } from './AdvancedForm';
import { RateLimits } from './RateLimits';

export function ImageConfigFieldset({
  checkRateLimits,
  children,
  autoComplete,
  setValidity,
  fieldNamespace,
  values,
  errors,
}: PropsWithChildren<{
  values: Values;
  errors?: FormikErrors<Values>;
  fieldNamespace?: string;
  checkRateLimits?: boolean;
  autoComplete?: boolean;
  setValidity: (error?: string) => void;
}>) {
  const { setFieldValue } = useFormikContext<Values>();

  const Component = values.useRegistry ? SimpleForm : AdvancedForm;

  return (
    <div className="row">
      <Component
        autoComplete={autoComplete}
        fieldNamespace={fieldNamespace}
        values={values}
        errors={errors}
      />

      <div className="form-group">
        <div className="col-sm-12">
          {values.useRegistry ? (
            <Button
              size="small"
              color="link"
              icon={Globe}
              className="!ml-0 p-0 hover:no-underline"
              onClick={() => setFieldValue(namespaced('useRegistry'), false)}
            >
              Advanced mode
            </Button>
          ) : (
            <Button
              size="small"
              color="link"
              icon={Database}
              className="!ml-0 p-0 hover:no-underline"
              onClick={() => setFieldValue(namespaced('useRegistry'), true)}
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

  function namespaced(field: string) {
    return fieldNamespace ? `${fieldNamespace}.${field}` : field;
  }
}
