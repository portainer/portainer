export default function RepositoryTagViewModel(name, os, arch, size, digest) {
    this.Name = name;
    this.Os = os || '';
    this.Architecture = arch || '';
    this.Size = size || 0;
    this.Digest = digest || '';
}

export function RepositoryShortTag(name, digest) {
    this.Name = name;
    this.Digest = digest;
}