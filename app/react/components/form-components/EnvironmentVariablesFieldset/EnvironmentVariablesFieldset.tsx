import { useState } from 'react';
import { array, object, SchemaOf, string } from 'yup';

import { ArrayError } from '../InputList/InputList';

import { AdvancedMode } from './AdvancedMode';
import { SimpleMode } from './SimpleMode';
import { Value } from './types';

export function EnvironmentVariablesFieldset({
  onChange,
  values,
  errors,
}: {
  values: Value;
  onChange(value: Value): void;
  errors?: ArrayError<Value>;
}) {
  const [simpleMode, setSimpleMode] = useState(true);

  return (
    <div className="col-sm-12">
      {simpleMode ? (
        <SimpleMode
          onAdvancedModeClick={() => setSimpleMode(false)}
          onChange={onChange}
          value={values}
          errors={errors}
        />
      ) : (
        <AdvancedMode
          onSimpleModeClick={() => setSimpleMode(true)}
          onChange={onChange}
          value={values}
        />
      )}
    </div>
  );
}

export function envVarValidation(): SchemaOf<Value> {
  return array(
    object({
      name: string().required('Name is required'),
      value: string().default(''),
    })
  );
}
