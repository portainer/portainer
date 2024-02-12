import { Task, TaskSpec, TaskState } from 'docker-types/generated/1.41';

export class TaskViewModel {
  Id: string;

  Created: string;

  Updated: string;

  Slot: number;

  Spec?: TaskSpec;

  Status: Task['Status'];

  DesiredState: TaskState;

  ServiceId: string;

  NodeId: string;

  ContainerId: string = '';

  constructor(data: Task) {
    this.Id = data.ID || '';
    this.Created = data.CreatedAt || '';
    this.Updated = data.UpdatedAt || '';
    this.Slot = data.Slot || 0;
    this.Spec = data.Spec;
    this.Status = data.Status;
    this.DesiredState = data.DesiredState || 'pending';
    this.ServiceId = data.ServiceID || '';
    this.NodeId = data.NodeID || '';
    this.ContainerId = data.Status?.ContainerStatus?.ContainerID || '';
  }
}
