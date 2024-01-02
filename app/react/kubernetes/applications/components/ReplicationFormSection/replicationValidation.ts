import { SchemaOf, number, object } from 'yup';

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
    replicaCount: number()
      .min(0, 'Instance count must be greater than or equal to 0.')
      .test(
        'overflow',
        'This application would exceed available resources. Please review resource reservations or the instance count.',
        () => !resourceReservationsOverflow // must not have resource reservations overflow
      )
      .test(
        'quota',
        'This application would exceed available storage. Please review the persisted folders or the instance count.',
        () => !quotaExceeded // must not have quota exceeded
      )
      .test(
        'scalable',
        `The following storage option(s) do not support concurrent access from multiples instances: ${nonScalableStorage}. You will not be able to scale that application.`,
        () => !!supportScalableReplicaDeployment // must have support scalable replica deployment
      )
      .required('Instance count is required.'),
  });
}
