import { useState } from 'react';
import { array, object, SchemaOf, string } from 'yup';

import { ArrayError } from '../InputList/InputList';
import { buildUniquenessTest } from '../validate-unique';

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
    <>
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
    </>
  );
}

export function envVarValidation(): SchemaOf<Value> {
  return array(
    object({
      name: string().required('Name is required'),
      value: string().default(''),
    })
  ).test(
    'unique',
    'This environment variable is already defined.',
    buildUniquenessTest(
      () => 'This environment variable is already defined.',
      'name'
    )
  );
}
