function RegistryManifestsViewModel(data) {
  this.RepositoryName = data.name;
  this.TagName = data.tag;
  this.Architecture = data.architecture;
  this.History = data.history;
  this.LayersCount = data.fsLayers.length;
  this.Layers = data.fsLayers.map(function (elem) {
    return elem.blobSum;
  });  
}
