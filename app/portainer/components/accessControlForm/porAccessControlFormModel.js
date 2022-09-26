import { ResourceControlOwnership as RCO } from '@/react/portainer/access-control/types';

/**
 * @deprecated use only for angularjs components. For react components use ./model.ts
 */
export function AccessControlFormData() {
  this.AccessControlEnabled = true;
  this.Ownership = RCO.PRIVATE;
  this.AuthorizedUsers = [];
  this.AuthorizedTeams = [];
}
