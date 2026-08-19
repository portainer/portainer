import { SchemaOf, boolean, number, object } from 'yup';

import { nanNumberSchema } from '@/react-tools/yup-schemas';

import { AutoScalingFormValues } from './types';

type ValidationData = {
  autoScalerOverflow: boolean;
};

export function autoScalingValidation(
  validationData?: ValidationData
): SchemaOf<AutoScalingFormValues> {
  const { autoScalerOverflow } = validationData || {};
  return object({
    isUsed: boolean().required(),
    minReplicas: number().when('isUsed', (isUsed: boolean) =>
      isUsed
        ? nanNumberSchema('Minimum instances is required.')
            .required('Minimum instances is required.')
            .min(1, 'Minimum instances must be greater than 0.')
            .test(
              'maxReplicas',
              'Minimum instances must be less than maximum instances.',
              // eslint-disable-next-line func-names
              function (this, value?: number): boolean {
                if (!value) {
                  return true;
                }
                const { maxReplicas } = this.parent as AutoScalingFormValues;
                return !maxReplicas || value < maxReplicas;
              }
            )
        : number()
    ),
    maxReplicas: number().when('isUsed', (isUsed: boolean) =>
      isUsed
        ? nanNumberSchema('Maximum instances is required.')
            .required('Maximum instances is required.')
            .test(
              'minReplicas',
              'Maximum instances must be greater than minimum instances.',
              // eslint-disable-next-line func-names
              function (this, value?: number): boolean {
                if (!value) {
                  return false;
                }
                const { minReplicas } = this.parent as AutoScalingFormValues;
                return !minReplicas || value > minReplicas;
              }
            )
            .test(
              'overflow',
              'This application would exceed available resources. Please reduce the maximum instances or the resource reservations.',
              () => !autoScalerOverflow
            )
        : number()
    ),
    targetCpuUtilizationPercentage: number().when(
      'isUsed',
      (isUsed: boolean) =>
        isUsed
          ? nanNumberSchema('Target CPU utilization percentage is required.')
              .min(0, 'Target CPU usage must be greater than 0.')
              .max(100, 'Target CPU usage must be smaller than 100.')
              .required('Target CPU utilization percentage is required.')
          : number()
    ),
  });
}
