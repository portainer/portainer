import { SchemaOf, number, object } from 'yup';

import { ResourceQuotaFormValues } from './types';

type ValidationData = {
  maxMemoryLimit: number;
  maxCpuLimit: number;
  isEnvironmentAdmin: boolean;
};

export function resourceReservationValidation(
  validationData?: ValidationData
): SchemaOf<ResourceQuotaFormValues> {
  return object().shape({
    memoryLimit: number()
      .min(0)
      .test(
        'exhaused',
        `This namespace has exhausted its memory capacity and you will not be able to deploy the application.${
          validationData?.isEnvironmentAdmin
            ? ''
            : ' Contact your administrator to expand the memory capacity of the namespace.'
        }`,
        () => !!validationData && validationData.maxMemoryLimit > 0
      )
      .max(
        validationData?.maxMemoryLimit || 0,
        ({ value }) =>
          `Value must be between 0 and ${validationData?.maxMemoryLimit}MB now - the previous value of ${value} exceeds this`
      )
      .required(),
    cpuLimit: number()
      .min(0)
      .test(
        'exhaused',
        `This namespace has exhausted its CPU capacity and you will not be able to deploy the application.${
          validationData?.isEnvironmentAdmin
            ? ''
            : ' Contact your administrator to expand the CPU capacity of the namespace.'
        }`,
        () => !!validationData && validationData.maxCpuLimit > 0
      )
      .max(
        validationData?.maxCpuLimit || 0,
        ({ value }) =>
          `Value must be between 0 and ${validationData?.maxCpuLimit} now - the previous value of ${value} exceeds this`
      )
      .required(),
  });
}
