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

/**
 * Transform AngularJS UAC FormData model to React UAC FormData model
 * @param {AccessControlFormData} uac AngularJS format (see above)
 * @returns {AccessControlFormData} React format (see at @/react/portainer/access-control/types)
 */
export function toReactAccessControlFormData({ Ownership, AuthorizedTeams, AuthorizedUsers }) {
  return {
    ownership: Ownership, // type: ResourceControlOwnership;
    authorizedUsers: AuthorizedUsers, // type: UserId[];
    authorizedTeams: AuthorizedTeams, // type: TeamId[];
  };
}
