import { FormikErrors } from 'formik';

import { TemplateEnv } from '@/react/portainer/templates/app-templates/types';

import { FormControl } from '@@/form-components/FormControl';
import { Input, Select } from '@@/form-components/Input';

type Value = Record<string, string>;

export function EnvVarsFieldset({
  onChange,
  options,
  value,
  errors,
}: {
  options: Array<TemplateEnv>;
  onChange: (value: Value) => void;
  value: Value;
  errors?: FormikErrors<Value>;
}) {
  return (
    <>
      {options.map((env, index) => (
        <Item
          key={env.name}
          option={env}
          value={value[env.name]}
          onChange={(value) => handleChange(env.name, value)}
          errors={errors?.[index]}
        />
      ))}
    </>
  );

  function handleChange(name: string, envValue: string) {
    onChange({ ...value, [name]: envValue });
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
  return (
    <FormControl
      label={option.label || option.name}
      required={!option.preset}
      errors={errors}
    >
      {option.select ? (
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          options={option.select.map((o) => ({
            label: o.text,
            value: o.value,
          }))}
          disabled={option.preset}
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={option.preset}
        />
      )}
    </FormControl>
  );
}
