import { TLSConfiguration } from '../../settings/types';
import {
  TeamAccessPolicies,
  UserAccessPolicies,
} from '../../environments/types';

export type Catalog = {
  repositories: string[];
};

export enum RegistryTypes {
  ANONYMOUS,
  QUAY,
  AZURE,
  CUSTOM,
  GITLAB,
  PROGET,
  DOCKERHUB,
  ECR,
  GITHUB,
}

export interface RegistryAccess {
  UserAccessPolicies: UserAccessPolicies | null;
  TeamAccessPolicies: TeamAccessPolicies | null;
  Namespaces: string[];
}

export interface RegistryAccesses {
  [key: string]: RegistryAccess;
}

export interface Gitlab {
  ProjectId: number;
  InstanceURL: string;
  ProjectPath: string;
}

export interface Quay {
  UseOrganisation?: boolean;
  OrganisationName: string;
}

export interface Github {
  UseOrganisation: boolean;
  OrganisationName: string;
}

export interface Ecr {
  Region: string;
}

interface RegistryManagementConfiguration {
  Type: RegistryTypes;
  Authentication: boolean;
  Username: string;
  Password: string;
  TLSConfig: TLSConfiguration;
  Ecr: Ecr;
  AccessToken?: string;
  AccessTokenExpiry?: number;
}

export type RegistryId = number;
export interface Registry {
  Id: RegistryId;
  Type: RegistryTypes;
  Name: string;
  URL: string;
  BaseURL: string;
  Authentication: boolean;
  Username: string;
  RegistryAccesses: RegistryAccesses | null;
  Gitlab: Gitlab;
  Quay: Quay;
  Github: Github;
  Ecr: Ecr;
  ManagementConfiguration?: RegistryManagementConfiguration;
}
