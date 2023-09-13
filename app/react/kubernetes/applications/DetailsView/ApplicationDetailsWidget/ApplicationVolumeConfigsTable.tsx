import { KeyToPath, Pod } from 'kubernetes-types/core/v1';
import { Asterisk, Plus } from 'lucide-react';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

import { Application } from '../../types';
import { applicationIsKind } from '../../utils';

type Props = {
  namespace: string;
  app?: Application;
};

export function ApplicationVolumeConfigsTable({ namespace, app }: Props) {
  const containerVolumeConfigs = getApplicationVolumeConfigs(app);

  if (containerVolumeConfigs.length === 0) {
    return null;
  }

  return (
    <table className="table">
      <tbody>
        <tr className="text-muted">
          <td className="w-1/4">Container</td>
          <td className="w-1/4">Configuration path</td>
          <td className="w-1/4">Value</td>
          <td className="w-1/4">Configuration</td>
        </tr>
        {containerVolumeConfigs.map(
          (
            {
              containerVolumeMount,
              isInitContainer,
              containerName,
              item,
              volumeConfigName,
            },
            index
          ) => (
            <tr key={index}>
              <td>
                {containerName}
                {isInitContainer && (
                  <span>
                    <Icon icon={Asterisk} />(
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
              <td>
                {item.path
                  ? `${containerVolumeMount?.mountPath}/${item.path}`
                  : `${containerVolumeMount?.mountPath}`}
              </td>
              <td>
                {item.key && (
                  <div className="flex items-center">
                    <Icon icon={Plus} className="!mr-1" />
                    {item.key}
                  </div>
                )}
                {!item.key && '-'}
              </td>
              <td>
                {volumeConfigName && (
                  <Link
                    className="flex items-center"
                    to="kubernetes.configurations.configuration"
                    params={{ name: volumeConfigName, namespace }}
                  >
                    <Icon icon={Plus} className="!mr-1" />
                    {volumeConfigName}
                  </Link>
                )}
                {!volumeConfigName && '-'}
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}

// getApplicationVolumeConfigs returns a list of volume configs / secrets for each container and each item within the matching volume
function getApplicationVolumeConfigs(app?: Application) {
  if (!app) {
    return [];
  }

  const podSpec = applicationIsKind<Pod>('Pod', app)
    ? app.spec
    : app.spec?.template?.spec;
  const appContainers = podSpec?.containers || [];
  const appInitContainers = podSpec?.initContainers || [];
  const appVolumes = podSpec?.volumes || [];
  const allContainers = [...appContainers, ...appInitContainers];

  const appVolumeConfigs = allContainers.flatMap((container) => {
    // for each container, get the volume mount paths
    const matchingVolumes = appVolumes
      // filter app volumes by config map or secret
      .filter((volume) => volume.configMap || volume.secret)
      .flatMap((volume) => {
        // flatten by volume items if there are any
        const volConfigMapItems =
          volume.configMap?.items || volume.secret?.items || [];
        const volumeConfigName =
          volume.configMap?.name || volume.secret?.secretName;
        const containerVolumeMount = container.volumeMounts?.find(
          (volumeMount) => volumeMount.name === volume.name
        );
        if (volConfigMapItems.length === 0) {
          return [
            {
              volumeConfigName,
              containerVolumeMount,
              containerName: container.name,
              isInitContainer: appInitContainers.includes(container),
              item: {} as KeyToPath,
            },
          ];
        }
        // if there are items, return a volume config for each item
        return volConfigMapItems.map((item) => ({
          volumeConfigName,
          containerVolumeMount,
          containerName: container.name,
          isInitContainer: appInitContainers.includes(container),
          item,
        }));
      })
      // only return the app volumes where the container volumeMounts include the volume name (from map step above)
      .filter((volume) => volume.containerVolumeMount);
    return matchingVolumes;
  });

  return appVolumeConfigs;
}
