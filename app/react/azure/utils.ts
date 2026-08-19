import { ContainerGroup } from './types';

export function getPorts(containerGroup: ContainerGroup) {
  const addressPorts = containerGroup.properties.ipAddress
    ? containerGroup.properties.ipAddress.ports
    : [];
  const container = containerGroup.properties.containers.length
    ? containerGroup.properties.containers[0]
    : null;
  const containerPorts = container ? container.properties.ports : [];

  return addressPorts.map((binding, index) => {
    const port = containerPorts[index] ? containerPorts[index].port : undefined;
    return {
      container: port,
      host: binding.port,
      protocol: binding.protocol,
    };
  });
}
