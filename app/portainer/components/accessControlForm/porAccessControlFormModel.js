import { ResourceControlOwnership as RCO } from 'Portainer/models/resourceControl/resourceControlOwnership';

export function AccessControlFormData() {
  this.AccessControlEnabled = true;
  this.Ownership = RCO.PRIVATE;
  this.AuthorizedUsers = [];
  this.AuthorizedTeams = [];
}
