import { ImageInspect } from 'docker-types/generated/1.41';

type ImageInspectConfig = NonNullable<ImageInspect['Config']>;

export class ImageDetailsViewModel {
  Id: ImageInspect['Id'];

  Parent: ImageInspect['Parent'];

  Created: ImageInspect['Created'];

  RepoTags: ImageInspect['RepoTags'];

  Size: ImageInspect['Size'];

  DockerVersion: ImageInspect['DockerVersion'];

  Os: ImageInspect['Os'];

  Architecture: ImageInspect['Architecture'];

  Author: ImageInspect['Author'];

  // Config sub fields

  Command: ImageInspectConfig['Cmd'];

  Entrypoint: Required<ImageInspectConfig['Entrypoint']>;

  ExposedPorts: Required<ImageInspectConfig['ExposedPorts']>;

  Volumes: Required<ImageInspectConfig>['Volumes'];

  Env: Required<ImageInspectConfig>['Env'];

  Labels: ImageInspectConfig['Labels'];

  // computed fields

  Used: boolean = false;

  constructor(data: ImageInspect) {
    this.Id = data.Id;
    // this.Tag = data.Tag; // doesn't seem to be used?
    this.Parent = data.Parent;
    this.Created = data.Created;
    // this.Repository = data.Repository; // doesn't seem to be used?
    this.RepoTags = data.RepoTags;
    this.Size = data.Size;
    this.DockerVersion = data.DockerVersion;
    this.Os = data.Os;
    this.Architecture = data.Architecture;
    this.Author = data.Author;
    this.Command = data.Config?.Cmd;

    let config: ImageInspect['Config'] = {};
    if (data.Config) {
      config = data.Config; // this is part of OCI images-spec
    } else if (data.ContainerConfig) {
      config = data.ContainerConfig; // not OCI ; has been removed in Docker 26 (API v1.45) along with .Container
    }
    this.Entrypoint = config.Entrypoint ?? [''];
    this.ExposedPorts = config.ExposedPorts
      ? Object.keys(config.ExposedPorts)
      : [];
    this.Volumes = config.Volumes ? Object.keys(config.Volumes) : [];
    this.Env = config.Env ?? [];
    this.Labels = config.Labels;
  }
}
