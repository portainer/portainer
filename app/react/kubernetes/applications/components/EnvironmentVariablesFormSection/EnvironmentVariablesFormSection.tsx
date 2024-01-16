import { FormSection } from '@@/form-components/FormSection';
import {
  EnvVarValues,
  EnvironmentVariablesFieldset,
} from '@@/form-components/EnvironmentVariablesFieldset';
import { ArrayError } from '@@/form-components/InputList/InputList';

type Props = {
  values: EnvVarValues;
  onChange(value: EnvVarValues): void;
  errors?: ArrayError<EnvVarValues>;
};

export function EnvironmentVariablesFormSection({
  values,
  onChange,
  errors,
}: Props) {
  return (
    <FormSection title="Environment variables" titleSize="sm">
      <div className="mb-4">
        <EnvironmentVariablesFieldset
          values={values}
          onChange={onChange}
          errors={errors}
        />
      </div>
    </FormSection>
  );
}
