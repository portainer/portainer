import { splitargs } from './splitargs';

export function commandStringToArray(command: string) {
  return splitargs(command);
}

export function commandArrayToString(array: string[]) {
  return array.map((elem) => `'${elem}'`).join(' ');
}

export function getSwarmService(container: {
  Config?: { Labels?: Record<string, unknown> };
}) {
  return container.Config?.Labels?.['com.docker.swarm.service.id'];
}

export function isPartOfSwarmService(
  ...params: Parameters<typeof getSwarmService>
) {
  return !!getSwarmService(...params);
}
