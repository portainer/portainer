import { SchemaOf, string } from 'yup';

type ValidationData = {
  hasQuota: boolean;
  isResourceQuotaCapacityExceeded: boolean;
  namespaceOptionCount: number;
  isEnvironmentAdmin: boolean;
};

const emptyValue =
  'You do not have access to any namespace. Contact your administrator to get access to a namespace.';

export function namespaceSelectorValidation(
  validationData?: ValidationData
): SchemaOf<string> {
  const {
    hasQuota,
    isResourceQuotaCapacityExceeded,
    namespaceOptionCount,
    isEnvironmentAdmin,
  } = validationData || {};
  return string()
    .required(emptyValue)
    .typeError(emptyValue)
    .test(
      'resourceQuotaCapacityExceeded',
      `This namespace has exhausted its resource capacity and you will not be able to deploy the application.${
        isEnvironmentAdmin
          ? ''
          : ' Contact your administrator to expand the capacity of the namespace.'
      }`,
      () => {
        const hasQuotaExceeded = hasQuota && isResourceQuotaCapacityExceeded;
        return !hasQuotaExceeded;
      }
    )
    .test('namespaceOptionCount', emptyValue, () => !!namespaceOptionCount);
}
