import { ManifestV2 } from '../../queries/manifest.service';

export class RepositoryTagViewModel {
  Name: string;

  Os: string;

  Architecture: string;

  Size: number;

  ImageDigest: string;

  ImageId: string;

  ManifestV2: ManifestV2 & { digest: string };

  History: unknown[];

  constructor(
    name: string,
    os: string,
    arch: string,
    size: number,
    imageDigest: string,
    imageId: string,
    v2: ManifestV2 & {
      digest: string;
    },
    history: unknown[]
  ) {
    this.Name = name;
    this.Os = os || '';
    this.Architecture = arch || '';
    this.Size = size || 0;
    this.ImageDigest = imageDigest || '';
    this.ImageId = imageId || '';
    this.ManifestV2 = v2 || {};
    this.History = history || [];
  }
}
