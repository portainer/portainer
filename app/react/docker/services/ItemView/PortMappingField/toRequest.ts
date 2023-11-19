import { EndpointPortConfig } from 'docker-types/generated/1.41';
import _ from 'lodash';

import { Values } from './PortsMappingField';
import { isRange } from './types';

export function toRequest(portBindings: Values): Array<EndpointPortConfig> {
  return _.compact(
    portBindings.flatMap((portBinding) => {
      const { hostPort, protocol, containerPort, publishMode } = portBinding;
      if (!hostPort && !containerPort) {
        return null;
      }

      if (isRange(hostPort) && isRange(containerPort)) {
        if (
          hostPort.end - hostPort.start !==
          containerPort.end - containerPort.start
        ) {
          throw new Error(
            `Invalid port specification: host port range must be equal to container port range`
          );
        }

        return Array.from(
          { length: hostPort.end - hostPort.start + 1 },
          (_, i) => ({
            PublishedPort: hostPort.start + i,
            Protocol: protocol,
            TargetPort: containerPort.start + i,
            PublishMode: publishMode,
          })
        );
      }

      if (isRange(hostPort) && !isRange(containerPort)) {
        return Array.from(
          { length: hostPort.end - hostPort.start + 1 },
          (_, i) => ({
            PublishedPort: hostPort.start + i,
            Protocol: protocol,
            TargetPort: containerPort,
            PublishMode: publishMode,
          })
        );
      }

      if (!isRange(hostPort) && !isRange(containerPort)) {
        return {
          PublishedPort: hostPort,
          Protocol: protocol,
          TargetPort: containerPort,
          PublishMode: publishMode,
        };
      }

      throw new Error(
        `Invalid port specification: host port must be a range when container port is a range`
      );
    })
  );
}
