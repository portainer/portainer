import _ from 'lodash';

import { StackType } from '@/react/common/stacks/types';

export class ExternalStackViewModel {
  Id: string;

  Name: string;

  Type: StackType;

  CreationDate: number;

  External: boolean;

  constructor(name: string, type: StackType, creationDate: number) {
    this.Id = `external-stack_${_.uniqueId()}`;
    this.Name = name;
    this.Type = type;
    this.CreationDate = creationDate;

    this.External = true;
  }
}
