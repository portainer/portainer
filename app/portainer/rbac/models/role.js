export function RoleViewModel(id, name, description, authorizations) {
  this.ID = id;
  this.Name = name;
  this.Description = description;
  this.Authorizations = authorizations;
}

export const RoleTypes = Object.freeze({
  ENDPOINT_ADMIN: 1,
  HELPDESK: 2,
  STANDARD: 3,
  READ_ONLY: 4,
  OPERATOR: 5,
});
