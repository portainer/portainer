import { Environment } from '../../types';

import { EdgeDeploymentInfo } from './EdgeDeploymentInfo';
import { EdgeAssociationInfo } from './EdgeAssociationInfo';

export function EdgeEnvironmentDetails({
  environment,
}: {
  environment: Environment;
}) {
  return environment.EdgeID ? (
    <EdgeAssociationInfo environment={environment} />
  ) : (
    <EdgeDeploymentInfo environment={environment} />
  );
}
