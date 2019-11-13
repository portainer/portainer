export function RepositoryTagViewModel(name, os, arch, size, imageDigest, imageId, v2, history) {
    this.Name = name;
    this.Os = os || '';
    this.Architecture = arch || '';
    this.Size = size || 0;
    this.ImageDigest = imageDigest || '';
    this.ImageId = imageId || '';
    this.ManifestV2 = v2 || {};
    this.History = history || [];
}

export function RepositoryShortTag(name, imageId, imageDigest, manifest) {
    this.Name = name;
    this.ImageId = imageId;
    this.ImageDigest = imageDigest;
    this.ManifestV2 = manifest;
}

export function RepositoryAddTagPayload(tag, manifest) {
    this.Tag = tag;
    this.Manifest = manifest;
}
