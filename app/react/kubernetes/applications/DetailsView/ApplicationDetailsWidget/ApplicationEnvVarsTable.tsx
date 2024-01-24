import { EnvVar, Pod } from 'kubernetes-types/core/v1';
import { Asterisk, File, FileCode, Key, Lock } from 'lucide-react';

import { Icon } from '@@/Icon';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

import { Application } from '../../types';
import { applicationIsKind } from '../../utils';

type Props = {
  namespace: string;
  app?: Application;
};

export function ApplicationEnvVarsTable({ namespace, app }: Props) {
  const appEnvVars = getApplicationEnvironmentVariables(app);

  return (
    <>
      <div className="text-muted mb-4 mt-6 flex items-center">
        <Icon icon={File} className="!mr-2" />
        Environment variables, ConfigMaps or Secrets
      </div>
      {appEnvVars.length === 0 && (
        <TextTip color="blue">
          This application is not using any environment variable, ConfigMap or
          Secret.
        </TextTip>
      )}
      {appEnvVars.length > 0 && (
        <table className="table">
          <tbody>
            <tr className="text-muted">
              <td className="w-1/4">Container</td>
              <td className="w-1/4">Environment variable</td>
              <td className="w-1/4">Value</td>
              <td className="w-1/4">Configuration</td>
            </tr>
            {appEnvVars.map((envVar, index) => (
              <tr key={index}>
                <td data-cy="k8sAppDetail-containerName">
                  {envVar.containerName}
                  {envVar.isInitContainer && (
                    <span>
                      <Icon icon={Asterisk} className="!ml-1" />
                      {envVar.valueFrom?.fieldRef?.fieldPath} (
                      <a
                        href="https://kubernetes.io/docs/concepts/workloads/pods/init-containers/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        init container
                      </a>
                      )
                    </span>
                  )}
                </td>
                <td data-cy="k8sAppDetail-envVarName">{envVar.name}</td>
                <td data-cy="k8sAppDetail-envVarValue">
                  {envVar.value && <span>{envVar.value}</span>}
                  {envVar.valueFrom?.fieldRef?.fieldPath && (
                    <span>
                      <Icon icon={Asterisk} className="!ml-1" />
                      {envVar.valueFrom.fieldRef.fieldPath} (
                      <a
                        href="https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        downward API
                      </a>
                      )
                    </span>
                  )}
                  {envVar.valueFrom?.secretKeyRef?.key && (
                    <span className="flex items-center">
                      <Icon icon={Key} className="!mr-1" />
                      {envVar.valueFrom.secretKeyRef.key}
                    </span>
                  )}
                  {envVar.valueFrom?.configMapKeyRef?.key && (
                    <span className="flex items-center">
                      <Icon icon={Key} className="!mr-1" />
                      {envVar.valueFrom.configMapKeyRef.key}
                    </span>
                  )}
                  {!envVar.value && !envVar.valueFrom && <span>-</span>}
                </td>
                <td data-cy="k8sAppDetail-configName">
                  {!envVar.valueFrom?.configMapKeyRef?.name &&
                    !envVar.valueFrom?.secretKeyRef?.name && <span>-</span>}
                  {envVar.valueFrom?.configMapKeyRef && (
                    <span>
                      <Link
                        to="kubernetes.configmaps.configmap"
                        params={{
                          name: envVar.valueFrom.configMapKeyRef.name,
                          namespace,
                        }}
                        className="flex items-center"
                      >
                        <Icon icon={FileCode} className="!mr-1" />
                        {envVar.valueFrom.configMapKeyRef.name}
                      </Link>
                    </span>
                  )}
                  {envVar.valueFrom?.secretKeyRef && (
                    <span>
                      <Link
                        to="kubernetes.secrets.secret"
                        params={{
                          name: envVar.valueFrom.secretKeyRef.name,
                          namespace,
                        }}
                        className="flex items-center"
                      >
                        <Icon icon={Lock} className="!mr-1" />
                        {envVar.valueFrom.secretKeyRef.name}
                      </Link>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

interface ContainerEnvVar extends EnvVar {
  containerName: string;
  isInitContainer: boolean;
}

function getApplicationEnvironmentVariables(
  app?: Application
): ContainerEnvVar[] {
  if (!app) {
    return [];
  }

  const podSpec = applicationIsKind<Pod>('Pod', app)
    ? app.spec
    : app.spec?.template?.spec;
  const appContainers = podSpec?.containers || [];
  const appInitContainers = podSpec?.initContainers || [];

  // get all the environment variables for each container
  const appContainersEnvVars =
    appContainers?.flatMap(
      (container) =>
        container?.env?.map((envVar) => ({
          ...envVar,
          containerName: container.name,
          isInitContainer: false,
        })) || []
    ) || [];
  const appInitContainersEnvVars =
    appInitContainers?.flatMap(
      (container) =>
        container?.env?.map((envVar) => ({
          ...envVar,
          containerName: container.name,
          isInitContainer: true,
        })) || []
    ) || [];

  return [...appContainersEnvVars, ...appInitContainersEnvVars];
}
