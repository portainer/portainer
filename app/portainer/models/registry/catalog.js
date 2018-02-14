function RegistryCatalogViewModel(data) {
  this.Repositories = data.repositories;
  this.Size = data.repositories.length;
  this.NotComplete = false;
}
