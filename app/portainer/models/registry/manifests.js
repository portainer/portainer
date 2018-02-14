function RegistryManifestsViewModel(data, headers) {
  this.RepositoryName = data.name;
  this.TagName = data.tag;
  this.Architecture = data.architecture;
  this.LayersCount = data.fsLayers.length;
  this.Layers = data.fsLayers.map(function (elem) {
    return elem.blobSum;
  });  
  this.History = data.history.map(function (elem) {
    var legacyHistory = JSON.parse(elem.v1Compatibility);
    return legacyHistory.container_config.Cmd.join(' ');
  });
  if (headers && headers["docker-content-digest"]) {
    this.Digest = headers["docker-content-digest"];
  }
}
