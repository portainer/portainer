import _ from 'lodash';

export class ExternalStackViewModel {
  Id: string;

  Name: string;

  Type: string;

  CreationDate: number;

  External: boolean;

  constructor(name: string, type: string, creationDate: number) {
    this.Id = _.uniqueId();
    this.Name = name;
    this.Type = type;
    this.CreationDate = creationDate;

    this.External = true;
  }
}
