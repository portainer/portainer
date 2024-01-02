import { SchemaOf, number, object } from 'yup';

import { ResourceQuotaFormValues } from './types';

type ValidationData = {
  maxMemoryLimit: number;
  maxCpuLimit: number;
};

export function resourceReservationValidation(
  validationData?: ValidationData
): SchemaOf<ResourceQuotaFormValues> {
  return object().shape({
    memoryLimit: number()
      .min(0)
      .max(
        validationData?.maxMemoryLimit || 0,
        `Value must be between 0 and ${validationData?.maxMemoryLimit}`
      )
      .required(),
    cpuLimit: number()
      .min(0)
      .max(
        validationData?.maxCpuLimit || 0,
        `Value must be between 0 and ${validationData?.maxCpuLimit}`
      )
      .required(),
  });
}
