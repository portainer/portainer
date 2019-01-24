export function RepositoryTagViewModel(name, imageId, os, arch, size, digest, repositoryName, fsLayers, history, manifestv2) {
    this.Name = name;
    this.ImageId = imageId || '';
    this.Os = os || '';
    this.Architecture = arch || '';
    this.Size = size || 0;
    this.Digest = digest || '';
    this.RepositoryName = repositoryName || '';
    this.FsLayers = fsLayers || [];
    this.History = history || [];
    this.ManifestV2 = manifestv2 || {};
}