import { getTask } from '@/react/docker/tasks/queries/useTask';
import { getTasks } from '@/react/docker/proxy/queries/tasks/useTasks';
import { getTaskLogs } from '@/react/docker/tasks/queries/useTaskLogs';

import { TaskViewModel } from '../models/task';
import { formatLogs } from '../helpers/logHelper';

angular.module('portainer.docker').factory('TaskService', TaskServiceFactory);

/* @ngInject */
function TaskServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    task: useAxios(injectEnvironmentId(taskAngularJS)), // task edit
    tasks: useAxios(injectEnvironmentId(tasksAngularJS)), // services list + service edit + swarm visualizer + stack edit
    logs: useAxios(injectEnvironmentId(taskLogsAngularJS)), // task logs
  };

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {TaskId} id
   */
  async function taskAngularJS(environmentId, id) {
    const data = await getTask(environmentId, id);
    return new TaskViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {*} filters
   */
  async function tasksAngularJS(environmentId, filters) {
    const data = await getTasks(environmentId, filters);
    return data.map((t) => new TaskViewModel(t));
  }

  /**
   * @param {EnvironmentId} environmentId
   * @param {TaskId} id
   * @param {boolean?} stdout
   * @param {boolean?} stderr
   * @param {boolean?} timestamps
   * @param {number?} since
   * @param {number?} tail
   */
  async function taskLogsAngularJS(environmentId, id, stdout = false, stderr = false, timestamps = false, since = 0, tail = 'all') {
    const data = await getTaskLogs(environmentId, id, {
      since,
      stderr,
      stdout,
      tail,
      timestamps,
    });
    return formatLogs(data, { stripHeaders: true, withTimestamps: !!timestamps });
  }
}
