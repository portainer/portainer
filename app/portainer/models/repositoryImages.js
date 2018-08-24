function RepositoryImageViewModel(id, name, tags, created, size, digest, fsLayers, history, signatures, manifestV2) {
  this.Id = id;
  this.Name = name;
  this.Tags = tags;
  this.Created = created;
  this.Size = size;
  this.Digest = digest;
  this.FsLayers = fsLayers;
  this.History = history;
  this.Signatures = signatures;
  this.ManifestV2 = manifestV2;
}