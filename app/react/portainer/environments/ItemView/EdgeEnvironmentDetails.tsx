import { Environment } from '../types';

import { EdgeDeploymentInfo } from './EdgeDeploymentInfo';
import { EdgeAssociationInfo } from './EdgeAssociationInfo';

export function EdgeEnvironmentDetails({
  environment,
}: {
  environment: Environment;
}) {
  return (
    <div className="row">
      <div>
        {environment.EdgeID ? (
          <EdgeAssociationInfo environment={environment} />
        ) : (
          <EdgeDeploymentInfo environment={environment} />
        )}
      </div>
    </div>
  );
}
