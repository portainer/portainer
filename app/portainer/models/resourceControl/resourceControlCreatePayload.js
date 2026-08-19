/**
 * Payload for resourceControleCreate operation
 * @param {string} resourceId ID of involved Resource
 * @param {ResourceControlResourceType} resourceType Type of involved Resource
 * @param {ResourceControlOwnershipParameters} data Transcient type from view data to payload
 */
export function ResourceControlCreatePayload(resourceId, resourceType, data) {
  void data;

  this.ResourceID = resourceId;
  this.Type = resourceType;
  this.Public = data.Public;
  this.AdministratorsOnly = data.AdministratorsOnly;
  this.Users = data.Users;
  this.Teams = data.Teams;
  this.SubResourceIDs = data.SubResourceIDs;
}
