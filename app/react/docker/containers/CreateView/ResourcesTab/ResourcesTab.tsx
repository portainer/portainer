import _ from 'lodash';
import { FormikErrors } from 'formik';
import { ReactNode } from 'react';

import { useIsStandAlone } from '@/react/docker/proxy/queries/useInfo';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

import { GpuFieldset, GpuFieldsetValues } from './GpuFieldset';
import { Values as RuntimeValues, RuntimeSection } from './RuntimeSection';
import { DevicesField, Values as Devices } from './DevicesField';
import { SysctlsField, Values as Sysctls } from './SysctlsField';
import {
  ResourceFieldset,
  Values as ResourcesValues,
} from './ResourcesFieldset';

export interface Values {
  runtime: RuntimeValues;

  devices: Devices;

  sysctls: Sysctls;

  sharedMemorySize: number;

  gpu: GpuFieldsetValues;

  resources: ResourcesValues;
}

export function ResourcesTab({
  values,
  setFieldValue,
  errors,
  allowPrivilegedMode,
  isInitFieldVisible,
  isDevicesFieldVisible,
  isSysctlFieldVisible,
  renderLimits,
}: {
  values: Values;
  setFieldValue: (field: string, value: unknown) => void;
  errors?: FormikErrors<Values>;
  allowPrivilegedMode: boolean;
  isInitFieldVisible: boolean;
  isDevicesFieldVisible: boolean;
  isSysctlFieldVisible: boolean;
  renderLimits?: (values: ResourcesValues) => ReactNode;
}) {
  const environmentId = useEnvironmentId();

  const environmentQuery = useCurrentEnvironment();

  const isStandalone = useIsStandAlone(environmentId);

  if (!environmentQuery.data) {
    return null;
  }

  const environment = environmentQuery.data;
  const gpuUseAll = _.get(environment, 'Snapshots[0].GpuUseAll', false);
  const gpuUseList = _.get(environment, 'Snapshots[0].GpuUseList', []);

  return (
    <div className="mt-3">
      <RuntimeSection
        values={values.runtime}
        onChange={(runtime) => setFieldValue('runtime', runtime)}
        allowPrivilegedMode={allowPrivilegedMode}
        isInitFieldVisible={isInitFieldVisible}
      />

      {isDevicesFieldVisible && (
        <DevicesField
          values={values.devices}
          onChange={(devices) => setFieldValue('devices', devices)}
        />
      )}

      {isSysctlFieldVisible && (
        <SysctlsField
          values={values.sysctls}
          onChange={(sysctls) => setFieldValue('sysctls', sysctls)}
        />
      )}

      <FormControl label="Shared memory size" inputId="shm-size">
        <div className="flex items-center gap-4">
          <Input
            id="shm-size"
            type="number"
            min="1"
            value={values.sharedMemorySize}
            onChange={(e) =>
              setFieldValue('sharedMemorySize', e.target.valueAsNumber)
            }
            className="w-32"
            data-cy="shared-memory-size"
          />
          <div className="small text-muted">
            Size of /dev/shm (<b>MB</b>)
          </div>
        </div>
      </FormControl>

      {isStandalone && (
        <GpuFieldset
          values={values.gpu}
          onChange={(gpu) => setFieldValue('gpu', gpu)}
          gpus={environment.Gpus || []}
          enableGpuManagement={environment.EnableGPUManagement}
          usedGpus={gpuUseList}
          usedAllGpus={gpuUseAll}
        />
      )}

      {renderLimits ? (
        renderLimits(values.resources)
      ) : (
        <ResourceFieldset
          values={values.resources}
          onChange={(resources) => setFieldValue('resources', resources)}
          errors={errors?.resources}
        />
      )}
    </div>
  );
}
