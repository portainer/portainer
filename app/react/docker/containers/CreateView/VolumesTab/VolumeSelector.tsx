import { truncate } from '@/portainer/filters/filters';
import { useVolumes } from '@/react/docker/volumes/queries/useVolumes';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Select } from '@@/form-components/ReactSelect';

export function VolumeSelector({
  value,
  onChange,
  inputId,
  allowAuto,
}: {
  value: string;
  onChange: (value?: string) => void;
  inputId?: string;
  allowAuto: boolean;
}) {
  const environmentId = useEnvironmentId();
  const volumesQuery = useVolumes(environmentId, {
    select(volumes) {
      return volumes.sort((vol1, vol2) => vol1.Name.localeCompare(vol2.Name));
    },
  });

  const initialVolumes = volumesQuery.data || [];

  const volumes = allowAuto
    ? [...initialVolumes, { Name: 'auto', Driver: '' }]
    : initialVolumes;

  const selectedValue = volumes.find((vol) => vol.Name === value);
  return (
    <Select
      placeholder="Select a volume"
      options={volumes}
      getOptionLabel={(vol) =>
        vol.Name !== 'auto'
          ? `${truncate(vol.Name, 30)} - ${truncate(vol.Driver, 30)}`
          : 'auto'
      }
      getOptionValue={(vol) => vol.Name}
      isMulti={false}
      value={selectedValue}
      onChange={(vol) => onChange(vol?.Name)}
      inputId={inputId}
      data-cy="docker-containers-volume-selector"
      size="sm"
    />
  );
}
