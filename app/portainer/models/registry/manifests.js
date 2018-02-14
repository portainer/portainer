function RegistryManifestsViewModel(data, headers, headersv2) {
  console.log(headersv2);
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
  if (headersv2 && headersv2["docker-content-digest"]) {
    this.Digest = headersv2["docker-content-digest"];
  }
}
