import { useMemo } from 'react';
import { Asterisk, Box, Boxes, Database } from 'lucide-react';
import { Container, Pod, Volume } from 'kubernetes-types/core/v1';
import { StatefulSet } from 'kubernetes-types/apps/v1';

import { EnvironmentId } from '@/react/portainer/environments/types';

import { Icon } from '@@/Icon';
import { TextTip } from '@@/Tip/TextTip';
import { Tooltip } from '@@/Tip/Tooltip';
import { Link } from '@@/Link';

import { Application } from '../../types';
import { applicationIsKind } from '../../utils';
import { useApplicationPods } from '../../application.queries';

type Props = {
  environmentId: EnvironmentId;
  namespace: string;
  appName: string;
  app?: Application;
};

export function ApplicationPersistentDataTable({
  namespace,
  app,
  environmentId,
  appName,
}: Props) {
  const { data: pods } = useApplicationPods(
    environmentId,
    namespace,
    appName,
    app
  );
  const persistedFolders = useMemo(
    () => getPersistedFolders(app, pods),
    [app, pods]
  );
  const dataAccessPolicy = getDataAccessPolicy(app);

  return (
    <>
      <div className="text-muted mb-4 mt-6 flex items-center">
        <Icon icon={Database} className="!mr-2 !shrink-0" />
        Data persistence
      </div>
      {!persistedFolders.length && (
        <TextTip color="blue">
          This application has no persisted folders.
        </TextTip>
      )}
      {persistedFolders.length > 0 && (
        <>
          <div className="small text-muted vertical-center mb-4">
            Data access policy:
            {dataAccessPolicy === 'isolated' && (
              <>
                <Icon icon={Boxes} />
                Isolated
                <Tooltip message="All the instances of this application are using their own data." />
              </>
            )}
            {dataAccessPolicy === 'shared' && (
              <>
                <Icon icon={Box} />
                Shared
                <Tooltip message="All the instances of this application are sharing the same data." />
              </>
            )}
          </div>
          {dataAccessPolicy === 'isolated' && (
            <table className="table">
              <thead>
                <tr className="text-muted">
                  <td className="w-1/4">Container name</td>
                  <td className="w-1/4">Pod name</td>
                  <td className="w-1/4">Persisted folder</td>
                  <td className="w-1/4">Persistence</td>
                </tr>
              </thead>
              <tbody>
                {persistedFolders.map((persistedFolder, index) => (
                  <tr key={index}>
                    <td>
                      {persistedFolder.volumeMount.container.name}
                      {persistedFolder.isContainerInit && (
                        <span>
                          <Icon icon={Asterisk} className="!mr-1" />(
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
                    <td>{persistedFolder.volumeMount?.pod?.metadata?.name}</td>
                    <td>{persistedFolder.volumeMount.mountPath}</td>
                    <td>
                      {persistedFolder.volume.persistentVolumeClaim && (
                        <Link
                          className="hyperlink flex items-center"
                          to="kubernetes.volumes.volume"
                          params={{
                            name: `${persistedFolder.volume.persistentVolumeClaim.claimName}-${persistedFolder.volumeMount?.pod?.metadata?.name}`,
                            namespace,
                          }}
                        >
                          <Icon icon={Database} className="!mr-1 shrink-0" />
                          {`${persistedFolder.volume.persistentVolumeClaim.claimName}-${persistedFolder.volumeMount?.pod?.metadata?.name}`}
                        </Link>
                      )}
                      {persistedFolder.volume.hostPath &&
                        `${persistedFolder.volume.hostPath.path} on host filesystem`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {dataAccessPolicy === 'shared' && (
            <table className="table">
              <thead>
                <tr className="text-muted">
                  <td className="w-1/3">Persisted folder</td>
                  <td className="w-2/3">Persistence</td>
                </tr>
              </thead>
              <tbody className="border-t-0">
                {persistedFolders.map((persistedFolder, index) => (
                  <tr key={index}>
                    <td data-cy="k8sAppDetail-volMountPath">
                      {persistedFolder.volumeMount.mountPath}
                    </td>
                    <td>
                      {persistedFolder.volume.persistentVolumeClaim && (
                        <Link
                          className="hyperlink flex items-center"
                          to="kubernetes.volumes.volume"
                          params={{
                            name: persistedFolder.volume.persistentVolumeClaim
                              .claimName,
                            namespace,
                          }}
                        >
                          <Icon icon={Database} className="!mr-1 shrink-0" />
                          {
                            persistedFolder.volume.persistentVolumeClaim
                              .claimName
                          }
                        </Link>
                      )}
                      {persistedFolder.volume.hostPath &&
                        `${persistedFolder.volume.hostPath.path} on host filesystem`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
}

function getDataAccessPolicy(app?: Application) {
  if (!app || applicationIsKind<Pod>('Pod', app)) {
    return 'none';
  }
  if (applicationIsKind<StatefulSet>('StatefulSet', app)) {
    return 'isolated';
  }
  return 'shared';
}

function getPodMatchingContainer(pods: Pod[], container: Container) {
  // find the first pod that matches the container
  const matchingPod = pods.find((pod) => {
    const podContainers = pod.spec?.containers || [];
    const podInitContainers = pod.spec?.initContainers || [];
    const podAllContainers = [...podContainers, ...podInitContainers];
    return podAllContainers.some(
      (podContainer) =>
        podContainer.name === container.name &&
        podContainer.image === container.image
    );
  });
  return matchingPod;
}

function getPersistedFolders(app?: Application, pods?: Pod[]) {
  if (!app || !pods) {
    return [];
  }

  const podSpec = applicationIsKind<Pod>('Pod', app)
    ? app.spec
    : app.spec?.template?.spec;

  const appVolumes = podSpec?.volumes || [];
  const appVolumeClaimVolumes = getVolumeClaimTemplates(app, appVolumes);
  const appAllVolumes = [...appVolumes, ...appVolumeClaimVolumes];

  const appContainers = podSpec?.containers || [];
  const appInitContainers = podSpec?.initContainers || [];
  const appAllContainers = [...appContainers, ...appInitContainers];

  const persistedFolders = appAllVolumes.flatMap((volume) => {
    if (volume.persistentVolumeClaim || volume.hostPath) {
      const volumeMounts = appAllContainers
        .flatMap(
          (container) =>
            container.volumeMounts?.map((cm) => ({
              ...cm,
              container,
              pod: getPodMatchingContainer(pods, container),
            })) || []
        )
        .filter(
          // remove volumeMounts with duplicate names
          (volumeMount, index, self) => self.indexOf(volumeMount) === index
        );
      const matchingVolumeMount = volumeMounts.find(
        (volumeMount) => volumeMount.name === volume.name
      );
      if (matchingVolumeMount) {
        return [
          {
            volume,
            volumeMount: matchingVolumeMount,
            isContainerInit: appInitContainers.some(
              (container) =>
                container.name === matchingVolumeMount.container.name
            ),
          },
        ];
      }
    }
    return [];
  });
  return persistedFolders;
}

function getVolumeClaimTemplates(app: Application, volumes: Volume[]) {
  if (
    applicationIsKind<StatefulSet>('StatefulSet', app) &&
    app.spec?.volumeClaimTemplates
  ) {
    const volumeClaimTemplates: Volume[] = app.spec.volumeClaimTemplates.map(
      (vc) => ({
        name: vc.metadata?.name || '',
        persistentVolumeClaim: { claimName: vc.metadata?.name || '' },
      })
    );
    const newPVC = volumeClaimTemplates.filter(
      (vc) =>
        !volumes.find(
          (v) =>
            v.persistentVolumeClaim?.claimName ===
            vc.persistentVolumeClaim?.claimName
        )
    );
    return newPVC;
  }
  return [];
}
