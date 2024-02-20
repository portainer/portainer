import { SchemaOf, object } from 'yup';

import { nanNumberSchema } from '@/react-tools/yup-schemas';

import { ReplicaCountFormValues } from './types';

type ValidationData = {
  resourceReservationsOverflow: boolean;
  quotaExceeded: boolean;
  nonScalableStorage: string;
  supportScalableReplicaDeployment: boolean;
};

export function replicationValidation(
  validationData?: ValidationData
): SchemaOf<ReplicaCountFormValues> {
  const {
    resourceReservationsOverflow,
    quotaExceeded,
    nonScalableStorage,
    supportScalableReplicaDeployment,
  } = validationData || {};
  return object({
    replicaCount: nanNumberSchema('Instance count is required')
      .min(0, 'Instance count must be greater than or equal to 0.')
      .test(
        'overflow',
        'This application would exceed available resources. Please review resource reservations or the instance count.',
        (value) => {
          // the user can't fix the error here with 1 replica. There are validation errors in the resource reservations section that are helpful in a case of resourceReservationsOverflow.
          if (value === 1) {
            return true;
          }
          return !resourceReservationsOverflow;
        }
      )
      .test(
        'quota',
        'This application would exceed available storage. Please review the persisted folders or the instance count.',
        () => !quotaExceeded // must not have quota exceeded
      )
      .test(
        'scalable',
        `The following storage option(s) do not support concurrent access from multiples instances: ${nonScalableStorage}. You will not be able to scale that application.`,
        (value) => {
          if (!value || value <= 1) {
            return true;
          }
          return !!supportScalableReplicaDeployment;
        } // must have support scalable replica deployment
      )
      .required('Instance count is required.'),
  });
}
