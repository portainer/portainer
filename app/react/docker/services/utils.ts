/**
 * Associates tasks to a Docker service by filtering tasks that belong to the service.
 */
export function associateServiceTasks<TTask extends { ServiceId: string }>(
  service: { Id: string; Name: string },
  tasks: Array<TTask>
) {
  return tasks
    .filter((t) => t.ServiceId === service.Id)
    .map((t) => ({ ...t, ServiceName: service.Name }));
}
