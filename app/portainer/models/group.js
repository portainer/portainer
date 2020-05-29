export function EndpointGroupDefaultModel() {
  this.Name = '';
  this.Description = '';
  this.TagIds = [];
}

export function EndpointGroupModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Description = data.Description;
  this.TagIds = data.TagIds;
  this.AuthorizedUsers = data.AuthorizedUsers;
  this.AuthorizedTeams = data.AuthorizedTeams;
  this.UserAccessPolicies = data.UserAccessPolicies;
  this.TeamAccessPolicies = data.TeamAccessPolicies;
}

export function EndpointGroupCreateRequest(model, endpoints) {
  this.Name = model.Name;
  this.Description = model.Description;
  this.TagIds = model.TagIds;
  this.AssociatedEndpoints = endpoints;
}

export function EndpointGroupUpdateRequest(model, endpoints) {
  this.id = model.Id;
  this.Name = model.Name;
  this.Description = model.Description;
  this.TagIds = model.TagIds;
  this.AssociatedEndpoints = endpoints;
  this.UserAccessPolicies = model.UserAccessPolicies;
  this.TeamAccessPolicies = model.TeamAccessPolicies;
}
