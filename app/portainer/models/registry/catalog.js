function RegistryCatalogViewModel(data, headers) {
  this.Repositories = data.repositories;
  this.Size = data.repositories.length;
  this.NotComplete = false;
  if (headers.link) {
    this.NotComplete = true;
  }
}
