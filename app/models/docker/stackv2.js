function StackV2ViewModel(name, containers, services) {
  this.Name = name;
  this.Containers = containers;
  this.ContainerCount = containers.length;
  this.Services = services;
}
