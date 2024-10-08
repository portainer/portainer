import { Task } from 'docker-types/generated/1.41';

import { DeepPick } from '@/types/deepPick';

export class TaskViewModel {
  Id: NonNullable<Task['ID']>;

  Created: NonNullable<Task['CreatedAt']>;

  Updated: NonNullable<Task['UpdatedAt']>;

  Slot: NonNullable<Task['Slot']>;

  Spec?: Task['Spec'];

  Status?: Task['Status'];

  DesiredState: NonNullable<Task['DesiredState']>;

  ServiceId: NonNullable<Task['ServiceID']>;

  NodeId: NonNullable<Task['NodeID']>;

  ContainerId: DeepPick<Task, 'Status.ContainerStatus.ContainerID'>;

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
