import { FormikErrors } from 'formik';
import { array, SchemaOf, string } from 'yup';

import { FormError } from '@@/form-components/FormError';
import { InputList, ItemProps } from '@@/form-components/InputList';
import { InputLabeled } from '@@/form-components/Input/InputLabeled';

export type Values = Array<string>;

export function SecurityOptField({
  values,
  onChange,
  errors,
}: {
  values: Values;
  onChange: (value: Values) => void;
  errors?: FormikErrors<string>[];
}) {
  return (
    <InputList
      value={values}
      onChange={onChange}
      item={Item}
      addLabel="Add security-opt"
      label="SecurityOpt"
      errors={errors}
      itemBuilder={() => ''}
      data-cy="docker-container-securityopts"
    />
  );
}

function Item({ item, onChange, error, index }: ItemProps<string>) {
  return (
    <div className="w-full">
      <div className="flex w-full gap-4">
        <InputLabeled
          value={item}
          onChange={(e) => onChange(e.target.value)}
          label="Security Option"
          placeholder="e.g. seccomp=unconfined"
          className="w-full"
          size="small"
          data-cy={`docker-container-securityopt-name_${index}`}
        />
      </div>
      {error && (
        <FormError>
          {typeof error === 'string' ? error : Object.values(error)[0]}
        </FormError>
      )}
    </div>
  );
}

export function securityOptValidation(): SchemaOf<Values> {
  return array(string().required('Security option is required'));
}
