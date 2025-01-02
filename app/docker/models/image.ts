import { ImageSummary } from 'docker-types/generated/1.41';

import { PortainerResponse } from '@/react/docker/types';

export type ImageId = ImageSummary['Id'];
export type ImageName = string;

/**
 * Partial copy of ImageSummary
 */
export class ImageViewModel {
  Id: ImageId;

  Created: ImageSummary['Created'];

  RepoTags: ImageSummary['RepoTags'];

  Size: ImageSummary['Size'];

  Labels: ImageSummary['Labels'];

  // internal

  NodeName: string;

  Used: boolean = false;

  constructor(data: PortainerResponse<ImageSummary>, used: boolean = false) {
    this.Id = data.Id;
    // this.Tag = data.Tag; // doesn't seem to be used?
    // this.Repository = data.Repository; // doesn't seem to be used?
    this.Created = data.Created;
    this.RepoTags = data.RepoTags;
    if ((!this.RepoTags || this.RepoTags.length === 0) && data.RepoDigests) {
      this.RepoTags = [];
      data.RepoDigests.forEach((digest) => {
        const repository = digest.substring(0, digest.indexOf('@'));
        this.RepoTags.push(`${repository}:<none>`);
      });
    }

    this.Size = data.Size;
    this.NodeName = data.Portainer?.Agent?.NodeName || '';
    this.Labels = data.Labels;
    this.Used = used;
  }
}
