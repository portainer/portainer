function EndpointType(value, title, classes, description) {
  this.Id = value;
  this.Value = value;
  this.Title = title;
  this.Classes = classes;
  this.Description = description;
}

export const InitEndpointEndpointTypes = [
  new EndpointType('docker', 'Docker', 'fab fa-docker', 'Manage the local Docker environment'),
  new EndpointType('kubernetes', 'Kubernetes', 'fas fa-dharmachakra', 'Manage the local Kubernetes environment'),
  new EndpointType('agent', 'Agent', 'fa fa-bolt', 'Connect to a Portainer agent')
];
