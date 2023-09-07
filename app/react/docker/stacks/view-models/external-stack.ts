import _ from 'lodash';

import { StackType } from '@/react/common/stacks/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';

import { IResource } from '../../components/datatable/createOwnershipColumn';

export class ExternalStackViewModel implements IResource {
  Id: string;

  Name: string;

  ResourceControl?: ResourceControlViewModel;

  Type: StackType;

  CreationDate: number;

  CreatedBy?: string;

  UpdateDate?: number;

  UpdatedBy?: string;

  External: boolean;

  constructor(name: string, type: StackType, creationDate: number) {
    this.Id = `external-stack_${_.uniqueId()}`;
    this.Name = name;
    this.Type = type;
    this.CreationDate = creationDate;

    this.External = true;
  }
}
