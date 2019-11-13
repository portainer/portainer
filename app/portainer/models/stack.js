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
}

export function ExternalStackViewModel(name, type) {
  this.Name = name;
  this.Type = type;
  this.External = true;
  this.Checked = false;
}
