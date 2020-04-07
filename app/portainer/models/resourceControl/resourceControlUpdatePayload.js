/**
 * Payload for resourceControlUpdate operation
 * @param {ResourceControlOwnershipParameters} data 
 */
export function ResourceControlUpdatePayload(data) {
  this.Public = data.Public;
  this.AdministratorsOnly = data.AdministratorsOnly;
	this.Users = data.Users;
	this.Teams = data.Teams;
}