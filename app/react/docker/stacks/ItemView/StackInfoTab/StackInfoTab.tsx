import { AlertTriangle, Loader2 } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  Stack,
  StackDeploymentStatus,
  StackStatus,
  StackType,
} from '@/react/common/stacks/types';
import { GitReferenceCard } from '@/react/portainer/gitops/GitReferenceCard';

import { Alert } from '@@/Alert';
import { Icon } from '@@/Icon';
import { FormSection } from '@@/form-components/FormSection';

import { useSwarmStackResources } from '../useSwarmStackServices';
import { useComposeStackContainers } from '../useComposeStackContainers';

import { StackDuplicationForm } from './StackDuplicationForm/StackDuplicationForm';
import { StackActions } from './StackActions';
import { AssociateStackForm } from './AssociateStackForm';

interface StackInfoTabProps {
  stack?: Stack; // will be loaded only if regular or orphaned
  stackName: string;
  stackFileContent?: string;
  isRegular?: boolean;
  isExternal: boolean;
  isOrphaned: boolean;
  isOrphanedRunning: boolean;
  environmentId: number;
  yamlError?: string;
}

export function StackInfoTab({
  stack,
  stackName,
  stackFileContent,
  isRegular,
  isExternal,
  isOrphaned,
  isOrphanedRunning,
  environmentId,
  yamlError,
}: StackInfoTabProps) {
  const status = useStackStatus({
    status: stack?.Status,
    environmentId,
    name: stackName,
    type: stack?.Type,
  });

  return (
    <>
      <ExternalOrphanedWarning
        isExternal={isExternal}
        isOrphaned={isOrphaned || isOrphanedRunning}
      />

      {stack && (
        <DeploymentStatusSection
          status={stack.Status}
          deploymentStatus={stack.DeploymentStatus}
        />
      )}

      <FormSection title="Stack details">
        <div className="form-group">
          {stackName}

          {stack && (
            <div className="ml-3 inline-flex">
              <StackActions
                stack={stack}
                fileContent={stackFileContent}
                isRegular={isRegular}
                environmentId={environmentId}
                isExternal={isExternal}
                status={status}
              />
            </div>
          )}
        </div>
      </FormSection>

      {stack && (
        <>
          {isOrphaned ? (
            <AssociateStackForm
              stackName={stackName}
              environmentId={environmentId}
              isOrphanedRunning={isOrphanedRunning}
              stackId={stack.Id}
            />
          ) : (
            <div className="space-y-4">
              {!!stack.GitConfig &&
                !stack.FromAppTemplate &&
                !!stack.GitSourceId && (
                  <GitReferenceCard
                    gitConfig={stack.GitConfig}
                    autoUpdate={stack.AutoUpdate}
                    currentDeploymentInfo={stack.CurrentDeploymentInfo}
                    stackType="docker"
                    sourceId={stack.GitSourceId}
                  />
                )}

              {isRegular && !!stackFileContent && (
                <StackDuplicationForm
                  yamlError={yamlError}
                  currentEnvironmentId={environmentId}
                  originalFileContent={stackFileContent}
                  stack={stack}
                />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

function DeploymentStatusSection({
  status,
  deploymentStatus,
}: {
  status: StackStatus;
  deploymentStatus?: StackDeploymentStatus[];
}) {
  if (status === StackStatus.Deploying) {
    return (
      <FormSection title="Deployment">
        <div className="form-group">
          <p className="text-muted flex items-center gap-2">
            <Loader2 className="animate-spin" size={14} />
            Deployment in progress...
          </p>
        </div>
      </FormSection>
    );
  }

  if (status === StackStatus.Error) {
    const errorMessage = getLastDeploymentError(deploymentStatus);
    return (
      <FormSection title="Deployment error">
        <div className="form-group">
          <Alert color="error">{errorMessage || 'Deployment failed.'}</Alert>
        </div>
      </FormSection>
    );
  }

  return null;
}

function getLastDeploymentError(
  deploymentStatus?: StackDeploymentStatus[]
): string | undefined {
  if (!deploymentStatus?.length) return undefined;
  const last = deploymentStatus[deploymentStatus.length - 1];
  return last.Status === StackStatus.Error ? last.Message : undefined;
}

function ExternalOrphanedWarning({
  isExternal,
  isOrphaned,
}: {
  isExternal: boolean;
  isOrphaned: boolean;
}) {
  if (!isExternal && !isOrphaned) return null;

  return (
    <FormSection title="Information">
      <div className="form-group">
        <span className="small">
          <p className="text-muted flex items-start gap-1">
            <Icon icon={AlertTriangle} mode="warning" className="!mr-0" />
            {isExternal && (
              <span>
                This stack was created outside of Portainer. Control over this
                stack is limited.
              </span>
            )}
            {isOrphaned && (
              <span>
                This stack is orphaned. You can re-associate it with the current
                environment using the &quot;Associate to this environment&quot;
                feature.
              </span>
            )}
          </p>
        </span>
      </div>
    </FormSection>
  );
}

function useStackStatus({
  status,
  name,
  type,
  environmentId,
}: {
  status: Stack['Status'] | undefined;
  name: string;
  type: Stack['Type'] | undefined;
  environmentId: EnvironmentId;
}) {
  const servicesQuery = useSwarmStackResources(name, {
    enabled: type === StackType.DockerSwarm && !status,
  });
  const containersQuery = useComposeStackContainers(
    { environmentId, stackName: name },
    {
      enabled: type === StackType.DockerCompose && !status,
    }
  );

  const derivedSwarmStatus = servicesQuery.data?.length
    ? StackStatus.Active
    : StackStatus.Inactive;
  const derivedComposeStatus = containersQuery.data?.length
    ? StackStatus.Active
    : StackStatus.Inactive;
  const derivedStatus =
    type === StackType.DockerSwarm ? derivedSwarmStatus : derivedComposeStatus;

  return status || derivedStatus;
}
