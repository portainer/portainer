import { MountPoint } from 'docker-types/generated/1.44';

import { Link } from '@@/Link';

interface Props {
  volume: MountPoint;
  nodeName?: string;
}

export function VolumeRow({ volume, nodeName }: Props) {
  return (
    <tr>
      <td>{renderHostOrVolume()}</td>
      <td>{volume.Destination}</td>
    </tr>
  );

  function renderHostOrVolume() {
    if (volume.Type === 'volume' && volume.Name) {
      return (
        <Link
          to="docker.volumes.volume"
          params={{
            id: volume.Name,
            nodeName,
          }}
          data-cy="volume-link"
        >
          {volume.Name}
        </Link>
      );
    }

    return volume.Source;
  }
}
