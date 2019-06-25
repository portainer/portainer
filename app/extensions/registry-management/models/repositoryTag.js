export default function RepositoryTagViewModel(name, os, arch, size, digest, imageId, v2) {
    this.Name = name;
    this.Os = os || '';
    this.Architecture = arch || '';
    this.Size = size || 0;
    this.Digest = digest || '';
    this.ImageId = imageId || '';
    this.ManifestVZ = v2 || {};
}

export function RepositoryShortTag(name, digest, manifest) {
    this.Name = name;
    this.Digest = digest;
    this.ManifestVZ = manifest;
}