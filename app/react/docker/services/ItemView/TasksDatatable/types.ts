import { TaskViewModel } from '@/docker/models/task';
import { ContainerListViewModel } from '@/react/docker/containers/types';

export type DecoratedTask = TaskViewModel & {
  Container?: ContainerListViewModel;
};
