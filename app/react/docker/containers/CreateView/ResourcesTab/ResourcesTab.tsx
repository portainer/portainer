import _ from 'lodash';
import { FormikErrors } from 'formik';
import { useState } from 'react';

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
import { EditResourcesForm } from './EditResourceForm';

export interface Values {
  runtime: RuntimeValues;

  devices: Devices;

  sysctls: Sysctls;

  sharedMemorySize: number;

  gpu: GpuFieldsetValues;

  resources: ResourcesValues;
}

export function ResourcesTab({
  values: initialValues,
  onChange,
  allowPrivilegedMode,
  isInitFieldVisible,
  isDevicesFieldVisible,
  isSysctlFieldVisible,
  errors,
  isDuplicate,
  redeploy,
  isImageInvalid,
}: {
  values: Values;
  onChange: (values: Values) => void;
  allowPrivilegedMode: boolean;
  isInitFieldVisible: boolean;
  isDevicesFieldVisible: boolean;
  isSysctlFieldVisible: boolean;
  errors?: FormikErrors<Values>;
  isDuplicate?: boolean;
  redeploy: (values: Values) => Promise<void>;
  isImageInvalid: boolean;
}) {
  const [values, setControlledValues] = useState(initialValues);
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
        onChange={(runtime) => handleChange({ runtime })}
        allowPrivilegedMode={allowPrivilegedMode}
        isInitFieldVisible={isInitFieldVisible}
      />

      {isDevicesFieldVisible && (
        <DevicesField
          values={values.devices}
          onChange={(devices) => handleChange({ devices })}
        />
      )}

      {isSysctlFieldVisible && (
        <SysctlsField
          values={values.sysctls}
          onChange={(sysctls) => handleChange({ sysctls })}
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
              handleChange({ sharedMemorySize: e.target.valueAsNumber })
            }
            className="w-32"
          />
          <div className="small text-muted">
            Size of /dev/shm (<b>MB</b>)
          </div>
        </div>
      </FormControl>

      {isStandalone && (
        <GpuFieldset
          values={values.gpu}
          onChange={(gpu) => handleChange({ gpu })}
          gpus={environment.Gpus}
          enableGpuManagement={environment.EnableGPUManagement}
          usedGpus={gpuUseList}
          usedAllGpus={gpuUseAll}
        />
      )}

      {isDuplicate ? (
        <EditResourcesForm
          initialValues={values.resources}
          redeploy={(newValues) =>
            redeploy({ ...values, resources: newValues })
          }
          isImageInvalid={isImageInvalid}
        />
      ) : (
        <ResourceFieldset
          values={values.resources}
          onChange={(resources) => handleChange({ resources })}
          errors={errors?.resources}
        />
      )}
    </div>
  );

  function handleChange(newValues: Partial<Values>) {
    onChange({ ...values, ...newValues });
    setControlledValues({ ...values, ...newValues });
  }
}
