import { number, object, SchemaOf } from 'yup';

import { devicesValidation } from './DevicesField';
import { gpuFieldsetUtils } from './GpuFieldset';
import { resourcesValidation } from './ResourcesFieldset';
import { Values } from './ResourcesTab';
import { runtimeValidation } from './RuntimeSection';
import { sysctlsValidation } from './SysctlsField';
import { securityOptValidation } from './SecurityOptField';

export function validation({
  maxMemory,
  maxCpu,
}: {
  maxMemory?: number;
  maxCpu?: number;
} = {}): SchemaOf<Values> {
  return object({
    runtime: runtimeValidation(),
    devices: devicesValidation(),
    sysctls: sysctlsValidation(),
    securityOpt: securityOptValidation(),
    sharedMemorySize: number().min(0).default(0),
    gpu: gpuFieldsetUtils.validation(),
    resources: resourcesValidation({ maxMemory, maxCpu }),
  });
}
