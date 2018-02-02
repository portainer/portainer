function RegistryBlobsViewModel(data, headers) {
  this.Reference = headers['docker-content-digest'];
  this.Size = parseInt(headers['content-length'], 10);
}
