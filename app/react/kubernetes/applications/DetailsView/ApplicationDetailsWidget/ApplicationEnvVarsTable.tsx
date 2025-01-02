import { Pod } from 'kubernetes-types/core/v1';
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
                      {envVar.fieldPath} (
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
                <td data-cy="k8sAppDetail-envVarName">{envVar.key || '-'}</td>
                <td data-cy="k8sAppDetail-envVarValue">
                  {envVar.value && <span>{envVar.value}</span>}
                  {envVar.fieldPath && (
                    <span>
                      <Icon icon={Asterisk} className="!ml-1" />
                      {envVar.fieldPath} (
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
                  {envVar.type !== 'env' &&
                    (envVar.key ? (
                      <span className="flex items-center">
                        <Icon icon={Key} className="!mr-1" />
                        {envVar.key}
                      </span>
                    ) : (
                      '-'
                    ))}
                </td>
                <td data-cy="k8sAppDetail-configName">
                  {!envVar.resourseName && <span>-</span>}
                  {envVar.resourseName && (
                    <span>
                      <Link
                        to={
                          envVar.type === 'configMap'
                            ? 'kubernetes.configmaps.configmap'
                            : 'kubernetes.secrets.secret'
                        }
                        params={{
                          name: envVar.resourseName,
                          namespace,
                        }}
                        className="flex items-center"
                        data-cy={`configmap-link-${envVar.resourseName}`}
                      >
                        <Icon
                          icon={envVar.type === 'configMap' ? FileCode : Lock}
                          className="!mr-1"
                        />
                        {envVar.resourseName}
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

type EnvVarType = 'env' | 'configMap' | 'secret';
interface ContainerEnvVar {
  key?: string;
  value?: string;
  fieldPath?: string;
  containerName: string;
  isInitContainer: boolean;
  type: EnvVarType;
  resourseName: string;
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
    appContainers?.flatMap((container) => {
      const containerEnvVars: ContainerEnvVar[] =
        container?.env?.map((envVar) => {
          let envtype: EnvVarType = 'env';
          if (envVar?.valueFrom?.configMapKeyRef) {
            envtype = 'configMap';
          } else if (envVar?.valueFrom?.secretKeyRef) {
            envtype = 'secret';
          }
          return {
            key: envVar?.name,
            fieldPath: envVar?.valueFrom?.fieldRef?.fieldPath,
            containerName: container.name,
            isInitContainer: false,
            type: envtype,
            resourseName:
              envVar?.valueFrom?.configMapKeyRef?.name ||
              envVar?.valueFrom?.secretKeyRef?.name ||
              '',
            value: envVar?.value,
          };
        }) || [];

      const containerEnvFroms: ContainerEnvVar[] =
        container?.envFrom?.map((envFrom) => ({
          name: '',
          resourseName:
            envFrom?.configMapRef?.name || envFrom?.secretRef?.name || '',
          containerName: container.name,
          isInitContainer: false,
          type: envFrom?.configMapRef ? 'configMap' : 'secret',
        })) || [];

      return [...containerEnvVars, ...containerEnvFroms];
    }) || [];

  const appInitContainersEnvVars =
    appInitContainers?.flatMap((container) => {
      const containerEnvVars: ContainerEnvVar[] =
        container?.env?.map((envVar) => {
          let envtype: EnvVarType = 'env';
          if (envVar?.valueFrom?.configMapKeyRef) {
            envtype = 'configMap';
          } else if (envVar?.valueFrom?.secretKeyRef) {
            envtype = 'secret';
          }
          return {
            key: envVar?.name,
            fieldPath: envVar?.valueFrom?.fieldRef?.fieldPath,
            containerName: container.name,
            isInitContainer: true,
            type: envtype,
            resourseName:
              envVar?.valueFrom?.configMapKeyRef?.name ||
              envVar?.valueFrom?.secretKeyRef?.name ||
              '',
            value: envVar?.value,
          };
        }) || [];

      const containerEnvFroms: ContainerEnvVar[] =
        container?.envFrom?.map((envFrom) => ({
          name: '',
          resourseName:
            envFrom?.configMapRef?.name || envFrom?.secretRef?.name || '',
          containerName: container.name,
          isInitContainer: true,
          type: envFrom?.configMapRef ? 'configMap' : 'secret',
        })) || [];

      return [...containerEnvVars, ...containerEnvFroms];
    }) || [];

  return [...appContainersEnvVars, ...appInitContainersEnvVars];
}
