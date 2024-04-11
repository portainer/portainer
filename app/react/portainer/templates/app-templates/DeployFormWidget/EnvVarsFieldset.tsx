import { FormikErrors } from 'formik';
import { SchemaOf, object, string } from 'yup';

import { TemplateEnv } from '@/react/portainer/templates/app-templates/types';

import { FormControl } from '@@/form-components/FormControl';
import { Input, Select } from '@@/form-components/Input';

type Value = Record<string, string>;

export { type Value as EnvVarsValue };

export function EnvVarsFieldset({
  onChange,
  options,
  values,
  errors,
}: {
  options: Array<TemplateEnv>;
  onChange: (value: Value) => void;
  values: Value;
  errors?: FormikErrors<Value>;
}) {
  return (
    <>
      {options.map((env) => (
        <Item
          key={env.name}
          option={env}
          value={values[env.name]}
          onChange={(value) => handleChange(env.name, value)}
          errors={errors?.[env.name]}
        />
      ))}
    </>
  );

  function handleChange(name: string, envValue: string) {
    onChange({ ...values, [name]: envValue });
  }
}

function Item({
  onChange,
  option,
  value,
  errors,
}: {
  option: TemplateEnv;
  value: string;
  onChange: (value: string) => void;
  errors?: FormikErrors<string>;
}) {
  const inputId = `env_var_${option.name}`;
  return (
    <FormControl
      label={option.label || option.name}
      required={!option.preset}
      errors={errors}
      inputId={inputId}
    >
      {option.select ? (
        <Select
          value={value}
          data-cy={`env-var-select-${option.name}`}
          onChange={(e) => onChange(e.target.value)}
          options={option.select.map((o) => ({
            label: o.text,
            value: o.value,
          }))}
          disabled={option.preset}
          id={inputId}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={option.preset}
          id={inputId}
          data-cy="env-var-input"
        />
      )}
    </FormControl>
  );
}

export function getDefaultValues(definitions: Array<TemplateEnv>): Value {
  return Object.fromEntries(
    definitions.map((v) => {
      if (v.select) {
        return [v.name, v.select.find((v) => v.default)?.value || ''];
      }

      return [v.name, v.default || ''];
    })
  );
}

export function envVarsFieldsetValidation(
  definitions: Array<TemplateEnv>
): SchemaOf<Value> {
  return object(
    Object.fromEntries(
      definitions.map((v) => [v.name, string().required('Required')])
    )
  );
}
