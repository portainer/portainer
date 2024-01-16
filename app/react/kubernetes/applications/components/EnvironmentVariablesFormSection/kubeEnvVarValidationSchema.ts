import { SchemaOf, array, bool, object, string } from 'yup';

import { EnvVar } from '@@/form-components/EnvironmentVariablesFieldset/types';
import { buildUniquenessTest } from '@@/form-components/validate-unique';

export function kubeEnvVarValidationSchema(): SchemaOf<EnvVar[]> {
  return array(
    object({
      name: string()
        .required('Environment variable name is required')
        .matches(
          /^[a-zA-Z][a-zA-Z0-9_.-]*$/,
          `This field must consist of alphabetic characters, digits, '_', '-', or '.', and must not start with a digit (e.g. 'my.env-name', or 'MY_ENV.NAME', or 'MyEnvName1'`
        ),
      value: string().default(''),
      needsDeletion: bool().default(false),
      isNew: bool().default(false),
    })
  ).test(
    'unique',
    'This environment variable is already defined',
    buildUniquenessTest(
      () => 'This environment variable is already defined',
      'name'
    )
  );
}
