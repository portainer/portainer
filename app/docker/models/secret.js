import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

export function SecretViewModel(data) {
  this.Id = data.ID;
  this.CreatedAt = data.CreatedAt;
  this.UpdatedAt = data.UpdatedAt;
  this.Version = data.Version.Index;
  this.Name = data.Spec.Name;
  this.Labels = data.Spec.Labels;

  if (data.Portainer) {
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
  }
}
