import { string, object, array, SchemaOf } from 'yup';

import { registriesValidationSchema } from '../components/RegistriesFormSection/registriesValidationSchema';
import { getResourceQuotaValidationSchema } from '../components/ResourceQuotaFormSection/getResourceQuotaValidationSchema';

import { CreateNamespaceFormValues } from './types';

export function getNamespaceValidationSchema(
  memoryLimit: number,
  namespaceNames: string[]
): SchemaOf<CreateNamespaceFormValues> {
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
    resourceQuota: getResourceQuotaValidationSchema(memoryLimit),
    // ingress classes table is constrained already, and doesn't need validation
    ingressClasses: array(),
    registries: registriesValidationSchema,
  });
}
