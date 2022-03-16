import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

function b64DecodeUnicode(str) {
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
  } catch (err) {
    return atob(str);
  }
}

export function ConfigViewModel(data) {
  this.Id = data.ID;
  this.CreatedAt = data.CreatedAt;
  this.UpdatedAt = data.UpdatedAt;
  this.Version = data.Version.Index;
  this.Name = data.Spec.Name;
  this.Labels = data.Spec.Labels;
  this.Data = b64DecodeUnicode(data.Spec.Data);

  if (data.Portainer && data.Portainer.ResourceControl) {
    this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
  }
}
