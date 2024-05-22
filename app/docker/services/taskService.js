import { getTask } from '@/react/docker/tasks/queries/useTask';
import { getTasks } from '@/react/docker/proxy/queries/tasks/useTasks';

import { TaskViewModel } from '../models/task';

angular.module('portainer.docker').factory('TaskService', TaskServiceFactory);

/* @ngInject */
function TaskServiceFactory(AngularToReact) {
  return {
    task: AngularToReact.useAxios(taskAngularJS), // task edit
    tasks: AngularToReact.useAxios(tasksAngularJS), // services list + service edit + swarm visualizer + stack edit
  };

  async function taskAngularJS(environmentId, id) {
    const data = await getTask(environmentId, id);
    return new TaskViewModel(data);
  }

  async function tasksAngularJS(environmentId, filters) {
    const data = await getTasks(environmentId, filters);
    return data.map((t) => new TaskViewModel(t));
  }
}
