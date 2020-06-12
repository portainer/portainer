import { ResourceControlOwnership } from 'Portainer/models/resourceControl/resourceControlOwnership';

export function AccessControlPanelData() {
  this.Ownership = ResourceControlOwnership.ADMINISTRATORS;
  this.Ownership_Users = [];
  this.Ownership_Teams = [];
}
