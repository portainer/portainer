function ProviderViewModel(data) {
  this.Id = data.id;
  this.Namespace = data.namespace;
  console.log(JSON.stringify(data.resourceTypes, null, 4));
}
