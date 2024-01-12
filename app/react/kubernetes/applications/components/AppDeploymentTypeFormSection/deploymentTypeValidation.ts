import { SchemaOf, mixed } from 'yup';

import { DeploymentType } from '../../types';

type ValidationData = {
  isQuotaExceeded: boolean;
};

export function deploymentTypeValidation(
  validationData?: ValidationData
): SchemaOf<DeploymentType> {
  return mixed()
    .oneOf(['Replicated', 'Global'])
    .test(
      'exhaused',
      `This application would exceed available resources. Please review resource reservations or the instance count.`,
      () => !validationData?.isQuotaExceeded
    );
}
