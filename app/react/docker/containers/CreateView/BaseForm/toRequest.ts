import { CreateContainerRequest } from '../types';

import { Values } from './BaseForm';
import { parsePortBindingRequest } from './PortsMappingField.requestModel';

export function toRequest(
  oldConfig: CreateContainerRequest,
  values: Values
): CreateContainerRequest {
  const bindings = parsePortBindingRequest(values.ports);

  return {
    ...oldConfig,
    ExposedPorts: Object.fromEntries(
      Object.keys(bindings).map((key) => [key, {}])
    ),
    HostConfig: {
      ...oldConfig.HostConfig,
      PublishAllPorts: values.publishAllPorts,
      PortBindings: bindings,
      AutoRemove: values.autoRemove,
    },
  };
}
