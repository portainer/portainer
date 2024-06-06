import _ from 'lodash';
import { RestartPolicy } from 'docker-types/generated/1.41';

import { PorImageRegistryModel } from 'Docker/models/porImageRegistry';

import { Pair } from '../../settings/types';
import { Platform } from '../types';

import {
  AppTemplate,
  TemplateEnv,
  TemplateRepository,
  TemplateType,
} from './types';

export class TemplateViewModel {
  Id!: number;

  Title!: string;

  Type!: TemplateType;

  Description!: string;

  AdministratorOnly!: boolean;

  Name: string | undefined;

  Note: string | undefined;

  Categories!: string[];

  Platform!: Platform | undefined;

  Logo: string | undefined;

  Repository!: TemplateRepository;

  Hostname: string | undefined;

  RegistryModel!: PorImageRegistryModel;

  Command!: string;

  Network!: string;

  Privileged!: boolean;

  Interactive!: boolean;

  RestartPolicy!: RestartPolicy['Name'];

  Hosts!: string[];

  Labels!: Pair[];

  Env!: Array<TemplateEnv & { type: EnvVarType; value: string }>;

  Volumes!: {
    container: string;
    readonly: boolean;
    type: 'bind' | 'auto';
    bind: string | null;
  }[];

  Ports!: {
    hostPort: string | undefined;
    containerPort: string;
    protocol: 'tcp' | 'udp';
  }[];

  constructor(template: AppTemplate, version: string) {
    switch (version) {
      case '2':
        setTemplatesV2.call(this, template);
        break;
      case '3':
        setTemplatesV3.call(this, template);
        break;
      default:
        throw new Error('Unsupported template version');
    }
  }
}

function setTemplatesV3(this: TemplateViewModel, template: AppTemplate) {
  setTemplatesV2.call(this, template);
  this.Id = template.id;
}

let templateV2ID = 0;

function setTemplatesV2(this: TemplateViewModel, template: AppTemplate) {
  this.Id = templateV2ID++;
  this.Title = template.title;
  this.Type = template.type;
  this.Description = template.description;
  this.AdministratorOnly = template.administrator_only;
  this.Name = template.name;
  this.Note = template.note;
  this.Categories = template.categories ? template.categories : [];
  this.Platform = getPlatform(template.platform);
  this.Logo = template.logo;
  this.Repository = template.repository;
  this.Hostname = template.hostname;
  this.RegistryModel = new PorImageRegistryModel();
  this.RegistryModel.Image = template.image;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.RegistryModel.Registry.URL = template.registry || '';
  this.Command = template.command ? template.command : '';
  this.Network = template.network ? template.network : '';
  this.Privileged = template.privileged ? template.privileged : false;
  this.Interactive = template.interactive ? template.interactive : false;
  this.RestartPolicy = template.restart_policy
    ? template.restart_policy
    : 'always';
  this.Labels = template.labels ? template.labels : [];
  this.Hosts = template.hosts ? template.hosts : [];
  this.Env = templateEnv(template);
  this.Volumes = templateVolumes(template);
  this.Ports = templatePorts(template);
}

function templatePorts(data: AppTemplate) {
  return (
    data.ports?.map((p) => {
      const portAndProtocol = _.split(p, '/');
      const hostAndContainerPort = _.split(portAndProtocol[0], ':');

      return {
        hostPort:
          hostAndContainerPort.length > 1 ? hostAndContainerPort[0] : undefined,
        containerPort:
          hostAndContainerPort.length > 1
            ? hostAndContainerPort[1]
            : hostAndContainerPort[0],
        protocol: portAndProtocol[1] as 'tcp' | 'udp',
      };
    }) || []
  );
}

function templateVolumes(data: AppTemplate) {
  return (
    data.volumes?.map((v) => ({
      container: v.container,
      readonly: v.readonly || false,
      type: (v.bind ? 'bind' : 'auto') as 'bind' | 'auto',
      bind: v.bind ? v.bind : null,
    })) || []
  );
}

export enum EnvVarType {
  PreSelected = 1,
  Text = 2,
  Select = 3,
}

function templateEnv(data: AppTemplate) {
  return (
    data.env?.map((envvar) => ({
      name: envvar.name,
      label: envvar.label,
      description: envvar.description,
      default: envvar.default,
      preset: envvar.preset,
      select: envvar.select,
      ...getEnvVarTypeAndValue(envvar),
    })) || []
  );

  function getEnvVarTypeAndValue(envvar: TemplateEnv) {
    if (envvar.select) {
      return {
        type: EnvVarType.Select,
        value: envvar.select.find((v) => v.default)?.value || '',
      };
    }

    return {
      type: envvar.preset ? EnvVarType.PreSelected : EnvVarType.Text,
      value: envvar.default || '',
    };
  }
}

function getPlatform(platform?: 'linux' | 'windows' | '') {
  switch (platform) {
    case 'linux':
      return Platform.LINUX;
    case 'windows':
      return Platform.WINDOWS;

    default:
      return undefined;
  }
}
