import { useMemo } from 'react';
import { components, MultiValue } from 'react-select';
import { MultiValueRemoveProps } from 'react-select/dist/declarations/src/components/MultiValue';
import {
  ActionMeta,
  OnChangeValue,
} from 'react-select/dist/declarations/src/types';
import { OptionProps } from 'react-select/dist/declarations/src/components/Option';
import { array, bool, object, SchemaOf, string } from 'yup';
import { DeviceRequest } from 'docker-types/generated/1.41';

import { Select } from '@@/form-components/ReactSelect';
import { Switch } from '@@/form-components/SwitchField/Switch';
import { Tooltip } from '@@/Tip/Tooltip';
import { TextTip } from '@@/Tip/TextTip';

export interface Values {
  enabled: boolean;
  useSpecific: boolean;
  selectedGPUs: string[];
  capabilities: string[];
}

interface GpuOption {
  value: string;
  label: string;
  description?: string;
}

export interface GPU {
  value: string;
  name: string;
}

export interface Props {
  values: Values;
  onChange(values: Values): void;
  gpus: GPU[];
  usedGpus: string[];
  usedAllGpus: boolean;
  enableGpuManagement?: boolean;
}

const NvidiaCapabilitiesOptions = [
  // Taken from https://github.com/containerd/containerd/blob/master/contrib/nvidia/nvidia.go#L40
  {
    value: 'compute',
    label: 'compute',
    description: 'required for CUDA and OpenCL applications',
  },
  {
    value: 'compat32',
    label: 'compat32',
    description: 'required for running 32-bit applications',
  },
  {
    value: 'graphics',
    label: 'graphics',
    description: 'required for running OpenGL and Vulkan applications',
  },
  {
    value: 'utility',
    label: 'utility',
    description: 'required for using nvidia-smi and NVML',
  },
  {
    value: 'video',
    label: 'video',
    description: 'required for using the Video Codec SDK',
  },
  {
    value: 'display',
    label: 'display',
    description: 'required for leveraging X11 display',
  },
] as const;

function Option(props: OptionProps<GpuOption, true>) {
  const {
    data: { value, description },
  } = props;

  return (
    <div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <components.Option {...props}>
        {`${value} - ${description}`}
      </components.Option>
    </div>
  );
}

function MultiValueRemove(props: MultiValueRemoveProps<GpuOption, true>) {
  const {
    selectProps: { value },
  } = props;
  if (value && (value as MultiValue<GpuOption>).length === 1) {
    return null;
  }
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <components.MultiValueRemove {...props} />;
}

export function Gpu({
  values,
  onChange,
  gpus = [],
  usedGpus = [],
  usedAllGpus,
  enableGpuManagement,
}: Props) {
  const options = useMemo(() => {
    const options = (gpus || []).map((gpu) => ({
      value: gpu.value,
      label:
        usedGpus.includes(gpu.value) || usedAllGpus
          ? `${gpu.name} (in use)`
          : gpu.name,
    }));

    options.unshift({
      value: 'all',
      label: 'Use All GPUs',
    });

    return options;
  }, [gpus, usedGpus, usedAllGpus]);

  function onChangeValues(key: string, newValue: boolean | string[]) {
    const newValues = {
      ...values,
      [key]: newValue,
    };
    onChange(newValues);
  }

  function toggleEnableGpu() {
    onChangeValues('enabled', !values.enabled);
  }

  function onChangeSelectedGpus(
    newValue: OnChangeValue<GpuOption, true>,
    actionMeta: ActionMeta<GpuOption>
  ) {
    let { useSpecific } = values;
    let selectedGPUs = newValue.map((option) => option.value);

    if (actionMeta.action === 'select-option') {
      useSpecific = actionMeta.option?.value !== 'all';
      selectedGPUs = selectedGPUs.filter((value) =>
        useSpecific ? value !== 'all' : value === 'all'
      );
    }

    const newValues = { ...values, selectedGPUs, useSpecific };
    onChange(newValues);
  }

  function onChangeSelectedCaps(newValue: OnChangeValue<GpuOption, true>) {
    onChangeValues(
      'capabilities',
      newValue.map((option) => option.value)
    );
  }

  const gpuCmd = useMemo(() => {
    const devices = values.selectedGPUs.join(',');
    const deviceStr = devices === 'all' ? 'all,' : `device=${devices},`;
    const caps = values.capabilities.join(',');
    return `--gpus '${deviceStr}"capabilities=${caps}"'`;
  }, [values.selectedGPUs, values.capabilities]);

  const gpuValue = useMemo(
    () =>
      options.filter((option) => values.selectedGPUs.includes(option.value)),
    [values.selectedGPUs, options]
  );

  const capValue = useMemo(
    () =>
      NvidiaCapabilitiesOptions.filter((option) =>
        values.capabilities.includes(option.value)
      ),
    [values.capabilities]
  );

  return (
    <div>
      {!enableGpuManagement && (
        <TextTip color="blue">
          GPU in the UI is not currently enabled for this environment.
        </TextTip>
      )}
      <div className="form-group">
        <div className="col-sm-3 col-lg-2 control-label text-left">
          Enable GPU
          <Switch
            id="enabled"
            name="enabled"
            checked={values.enabled && !!enableGpuManagement}
            onChange={toggleEnableGpu}
            className="ml-2"
            disabled={enableGpuManagement === false}
          />
        </div>
        {enableGpuManagement && values.enabled && (
          <div className="col-sm-9 col-lg-10 text-left">
            <Select<GpuOption, true>
              isMulti
              closeMenuOnSelect
              value={gpuValue}
              isClearable={false}
              backspaceRemovesValue={false}
              isDisabled={!values.enabled}
              onChange={onChangeSelectedGpus}
              options={options}
              components={{ MultiValueRemove }}
            />
          </div>
        )}
      </div>

      {values.enabled && (
        <>
          <div className="form-group">
            <div className="col-sm-3 col-lg-2 control-label text-left">
              Capabilities
              <Tooltip message="‘compute’ and ‘utility’ capabilities are preselected by Portainer because they are used by default when you don’t explicitly specify capabilities with docker CLI ‘--gpus’ option." />
            </div>
            <div className="col-sm-9 col-lg-10 text-left">
              <Select<GpuOption, true>
                isMulti
                closeMenuOnSelect
                value={capValue}
                options={NvidiaCapabilitiesOptions}
                components={{ Option }}
                onChange={onChangeSelectedCaps}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="col-sm-3 col-lg-2 control-label text-left">
              Control
              <Tooltip message="This is the generated equivalent of the '--gpus' docker CLI parameter based on your settings." />
            </div>
            <div className="col-sm-9 col-lg-10">
              <code>{gpuCmd}</code>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function toViewModel(deviceRequests: Array<DeviceRequest> = []): Values {
  const deviceRequest = deviceRequests.find(
    (o) => o.Driver === 'nvidia' || o.Capabilities?.[0]?.[0] === 'gpu'
  );
  if (!deviceRequest) {
    return {
      enabled: false,
      useSpecific: false,
      selectedGPUs: ['all'],
      capabilities: ['compute', 'utility'],
    };
  }

  const useSpecific = deviceRequest.Count !== -1;

  return {
    enabled: true,
    useSpecific,
    selectedGPUs: useSpecific ? deviceRequest.DeviceIDs || [] : ['all'],
    capabilities: deviceRequest.Capabilities?.[0] || [],
  };
}

export function toRequest(
  deviceRequests: Array<DeviceRequest>,
  gpu: Values
): Array<DeviceRequest> {
  const driver = 'nvidia';

  const otherDeviceRequests = deviceRequests.filter(
    (deviceRequest) => deviceRequest.Driver !== driver
  );

  if (!gpu.enabled) {
    return otherDeviceRequests;
  }

  const deviceRequest: DeviceRequest = {
    Driver: driver,
    Count: -1,
    DeviceIDs: [], // must be empty if Count != 0 https://github.com/moby/moby/blob/master/daemon/nvidia_linux.go#L50
    Capabilities: [], // array of ORed arrays of ANDed capabilites = [ [c1 AND c2] OR [c1 AND c3] ] : https://github.com/moby/moby/blob/master/api/types/container/host_config.go#L272
  };

  if (gpu.useSpecific) {
    deviceRequest.DeviceIDs = gpu.selectedGPUs;
    deviceRequest.Count = 0;
  }
  deviceRequest.Capabilities = [gpu.capabilities];

  return [...otherDeviceRequests, deviceRequest];
}

export function gpuValidation(): SchemaOf<Values> {
  return object({
    capabilities: array()
      .of(string().default(''))
      .default(['compute', 'utility']),
    enabled: bool().default(false),
    selectedGPUs: array().of(string()).default(['all']),
    useSpecific: bool().default(false),
  });
}
