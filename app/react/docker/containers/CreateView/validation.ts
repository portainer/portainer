import { object, SchemaOf } from 'yup';
import { useMemo } from 'react';

import { baseFormUtils } from './BaseForm';
import { capabilitiesTabUtils } from './CapabilitiesTab';
import { commandsTabUtils } from './CommandsTab';
import { labelsTabUtils } from './LabelsTab';
import { networkTabUtils } from './NetworkTab';
import { resourcesTabUtils } from './ResourcesTab';
import { restartPolicyTabUtils } from './RestartPolicyTab';
import { volumesTabUtils } from './VolumesTab';
import { envVarsTabUtils } from './EnvVarsTab';
import { Values } from './useInitialValues';

export function useValidation({
  isAdmin,
  maxCpu,
  maxMemory,
  isDuplicating,
  isDuplicatingPortainer,
  isDockerhubRateLimited,
}: {
  isAdmin: boolean;
  maxCpu: number;
  maxMemory: number;
  isDuplicating: boolean | undefined;
  isDuplicatingPortainer: boolean | undefined;
  isDockerhubRateLimited: boolean;
}): SchemaOf<Values> {
  return useMemo(
    () =>
      object({
        commands: commandsTabUtils.validation(),
        volumes: volumesTabUtils.validation(),
        network: networkTabUtils.validation(),
        labels: labelsTabUtils.validation(),
        restartPolicy: restartPolicyTabUtils.validation(),
        resources: resourcesTabUtils.validation({ maxCpu, maxMemory }),
        capabilities: capabilitiesTabUtils.validation(),
        env: envVarsTabUtils.validation(),
      }).concat(
        baseFormUtils.validation({
          isAdmin,
          isDuplicating,
          isDuplicatingPortainer,
          isDockerhubRateLimited,
        })
      ),
    [
      isAdmin,
      isDockerhubRateLimited,
      isDuplicating,
      isDuplicatingPortainer,
      maxCpu,
      maxMemory,
    ]
  );
}
