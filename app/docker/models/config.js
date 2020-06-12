import { ResourceControlViewModel } from 'Portainer/models/resourceControl/resourceControl';

export function ConfigViewModel(data) {
  this.Id = data.ID;
  this.CreatedAt = data.CreatedAt;
  this.UpdatedAt = data.UpdatedAt;
  this.Version = data.Version.Index;
  this.Name = data.Spec.Name;
  this.Labels = data.Spec.Labels;
  this.Data = atob(data.Spec.Data);

  if (data.Portainer && data.Portainer.ResourceControl) {
    this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
  }
}
