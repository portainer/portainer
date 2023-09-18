import { TaskViewModel } from '@/docker/models/task';
import { DockerContainer } from '@/react/docker/containers/types';

export type DecoratedTask = TaskViewModel & {
  Container?: DockerContainer;
};
