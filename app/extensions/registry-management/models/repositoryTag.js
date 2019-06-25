export default function RepositoryTagViewModel(name, os, arch, size, imageDigest, imageId, v2) {
    this.Name = name;
    this.Os = os || '';
    this.Architecture = arch || '';
    this.Size = size || 0;
    this.ImageDigest = imageDigest || '';
    this.ImageId = imageId || '';
    this.ManifestV2 = v2 || {};
}

export function RepositoryShortTag(name, imageId, manifest) {
    this.Name = name;
    this.ImageId = imageId;
    this.ManifestV2 = manifest;
}