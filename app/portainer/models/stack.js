import { ResourceControlViewModel } from 'Portainer/models/resourceControl/resourceControl';

export function StackViewModel(data) {
  this.Id = data.Id;
  this.Type = data.Type;
  this.Name = data.Name;
  this.Checked = false;
  this.EndpointId = data.EndpointId;
  this.SwarmId = data.SwarmId;
  this.Env = data.Env ? data.Env : [];
  if (data.ResourceControl && data.ResourceControl.Id !== 0) {
    this.ResourceControl = new ResourceControlViewModel(data.ResourceControl);
  }
  this.External = false;
  this.Status = data.Status;
  this.CreationDate = data.CreationDate;
  this.CreatedBy = data.CreatedBy;
  this.UpdateDate = data.UpdateDate;
  this.UpdatedBy = data.UpdatedBy;
  this.GitConfig = data.GitConfig;
}

export function ExternalStackViewModel(name, type, creationDate) {
  this.Name = name;
  this.Type = type;
  this.External = true;
  this.Checked = false;
  this.CreationDate = creationDate;
}
