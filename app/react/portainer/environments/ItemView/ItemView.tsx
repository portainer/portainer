import { useIdParam } from '@/react/hooks/useIdParam';

import { PageHeader } from '@@/PageHeader';

import { useEnvironment } from '../queries';
import { getPlatformTypeName, isEdgeEnvironment } from '../utils';

import { EdgeInformationPanel } from './EdgeInformationPanel/EdgeInformationPanel';
import { EdgeAgentDeploymentWidget } from './EdgeAgentDeploymentWidget/EdgeAgentDeploymentWidget';
import { KubeConfigInfo } from './KubeConfigInfo/KubeConfigInfo';
import { EnvironmentDetailsForm } from './EnvironmentDetailsForm';

export function ItemView() {
  const id = useIdParam();
  const environmentQuery = useEnvironment(id);

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;

  const isEdge = isEdgeEnvironment(environment.Type);
  const platformName = getPlatformTypeName(environment.Type);

  return (
    <>
      <PageHeader
        title="Environment details"
        breadcrumbs={[
          { label: 'Environments', link: 'portainer.endpoints' },
          environment.Name,
        ]}
        reload
      />

      <div className="mx-4 space-y-4 [&>*]:block">
        {isEdge &&
          (environment.EdgeID ? (
            <EdgeInformationPanel
              environmentId={id}
              edgeKey={environment.EdgeKey}
              edgeId={environment.EdgeID}
              platformName={platformName}
            />
          ) : (
            <EdgeAgentDeploymentWidget
              edgeKey={environment.EdgeKey}
              edgeId={environment.EdgeID}
              asyncMode={environment.Edge?.AsyncMode}
            />
          ))}

        <KubeConfigInfo
          environmentId={id}
          environmentType={environment.Type}
          edgeId={environment.EdgeID}
          status={environment.Status}
        />

        <EnvironmentDetailsForm environment={environment} />
      </div>
    </>
  );
}
