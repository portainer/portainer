/**
 * Associates a container object to a task by matching their IDs.
 */
export function associateContainerToTask<TTask extends { ContainerId: string }>(
  task: TTask,
  containers: Array<{ Id: string }>
) {
  const container = containers.find((c) => c.Id === task.ContainerId);

  return {
    ...task,
    Container: container,
  };
}
