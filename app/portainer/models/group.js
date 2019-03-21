export function EndpointGroupDefaultModel() {
  this.Name = '';
  this.Description = '';
  this.Tags = [];
}

export function EndpointGroupModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Description = data.Description;
  this.Tags = data.Tags;
  this.AuthorizedUsers = data.AuthorizedUsers;
  this.AuthorizedTeams = data.AuthorizedTeams;
}

export function EndpointGroupCreateRequest(model, endpoints) {
  this.Name = model.Name;
  this.Description = model.Description;
  this.Tags = model.Tags;
  this.AssociatedEndpoints = endpoints;
}

export function EndpointGroupUpdateRequest(model, endpoints) {
  this.id = model.Id;
  this.Name = model.Name;
  this.Description = model.Description;
  this.Tags = model.Tags;
  this.AssociatedEndpoints = endpoints;
}
