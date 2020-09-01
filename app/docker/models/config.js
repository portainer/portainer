import { ResourceControlViewModel } from 'Portainer/models/resourceControl/resourceControl';

function b64DecodeUnicode(str) {
  return decodeURIComponent(
    atob(str)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}

export function ConfigViewModel(data) {
  this.Id = data.ID;
  this.CreatedAt = data.CreatedAt;
  this.UpdatedAt = data.UpdatedAt;
  this.Version = data.Version.Index;
  this.Name = data.Spec.Name;
  this.Labels = data.Spec.Labels;
  try {
    this.Data = b64DecodeUnicode(data.Spec.Data);
  } except (e) {
    console.error("Failed to decode config data for", this.name, ":", e);
    this.Data = "Failed to decode config data.";
  }

  if (data.Portainer && data.Portainer.ResourceControl) {
    this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
  }
}
