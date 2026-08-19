export const queryKeys = {
  nodes: (environmentId: number) => [
    'environments',
    environmentId,
    'kubernetes',
    'nodes',
  ],
  node: (environmentId: number, nodeName: string, isYaml?: boolean) => [
    'environments',
    environmentId,
    'kubernetes',
    'nodes',
    nodeName,
    isYaml ? 'yaml' : undefined,
  ],
};
