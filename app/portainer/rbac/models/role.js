export function RoleViewModel(data) {
  this.ID = data.Id;
  this.Name = data.Name;
  this.Description = data.Description;
  this.Authorizations = data.Authorizations;
}

export const RoleTypes = Object.freeze({
  ENDPOINT_ADMIN: 1,
  HELPDESK: 2,
  STANDARD: 3,
  READ_ONLY: 4,
});
