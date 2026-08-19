import { string, object, array, SchemaOf } from 'yup';

import { NamespaceFormValues } from '../../types';

import { registriesValidationSchema } from './RegistriesFormSection/registriesValidationSchema';
import { getResourceQuotaValidationSchema } from './ResourceQuotaFormSection/getResourceQuotaValidationSchema';

export function getNamespaceValidationSchema(
  memoryLimit: number,
  cpuLimit: number,
  namespaceNames: string[]
): SchemaOf<NamespaceFormValues> {
  return object({
    name: string()
      .matches(
        /^[a-z0-9](?:[-a-z0-9]{0,251}[a-z0-9])?$/,
        "This field must consist of lower case alphanumeric characters or '-', and contain at most 63 characters, and must start and end with an alphanumeric character."
      )
      .max(63, 'Name must be at most 63 characters.')
      // must not have the same name as an existing namespace
      .notOneOf(namespaceNames, 'Name must be unique.')
      .required('Name is required.'),
    resourceQuota: getResourceQuotaValidationSchema(memoryLimit, cpuLimit),
    // ingress classes table is constrained already, and doesn't need validation
    ingressClasses: array(),
    registries: registriesValidationSchema,
  });
}
