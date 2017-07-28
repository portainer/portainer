function StackV2ViewModel(name, services, containers) {
  this.Name = name;
  this.Services = services;
  this.ServiceCount = services.length;
  this.Containers = containers;
}
