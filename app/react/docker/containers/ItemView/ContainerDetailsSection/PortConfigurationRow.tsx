import { ArrowRight } from 'lucide-react';
import { PortMap } from 'docker-types/generated/1.44';

import { DetailsTable } from '@@/DetailsTable';

interface PortConfigurationRowProps {
  ports: PortMap | undefined;
}

export function PortConfigurationRow({ ports }: PortConfigurationRowProps) {
  const bindings = transformPortBindings(ports);

  if (bindings.length === 0) {
    return null;
  }

  return (
    <DetailsTable.Row label="Port configuration">
      {bindings.map((binding, index) => (
        <div key={index} className="flex items-center gap-2">
          {binding.host} <ArrowRight size={13} />
          {binding.container}
        </div>
      ))}
    </DetailsTable.Row>
  );
}

function transformPortBindings(ports: PortMap | undefined) {
  const bindings: Array<{ container: string; host: string }> = [];
  if (!ports) return bindings;

  Object.keys(ports).forEach((containerPort) => {
    const mappings = ports[containerPort];
    if (mappings) {
      mappings.forEach((mapping) => {
        bindings.push({
          container: containerPort,
          host: `${mapping.HostIp}:${mapping.HostPort}`,
        });
      });
    }
  });

  return bindings;
}
