import { TeamId } from '@/react/portainer/users/teams/types';
import { UserId } from '@/portainer/users/types';

export type Catalog = {
  repositories: string[];
};

export type Repository = {
  name: string;
  tags: string[];
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

export type RoleId = number;
interface AccessPolicy {
  RoleId: RoleId;
}

type UserAccessPolicies = Record<UserId, AccessPolicy>; // map[UserID]AccessPolicy
type TeamAccessPolicies = Record<TeamId, AccessPolicy>;

export interface RegistryAccess {
  UserAccessPolicies: UserAccessPolicies;
  TeamAccessPolicies: TeamAccessPolicies;
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
  UseOrganisation: boolean;
  OrganisationName: string;
}

export interface Github {
  UseOrganisation: boolean;
  OrganisationName: string;
}

export interface Ecr {
  Region: string;
}

export type RegistryId = number;
export interface Registry {
  Id: RegistryId;
  Type: number;
  Name: string;
  URL: string;
  BaseURL: string;
  Authentication: boolean;
  Username: string;
  Password: string;
  RegistryAccesses: RegistryAccesses;
  Checked: boolean;
  Gitlab: Gitlab;
  Quay: Quay;
  Github: Github;
  Ecr: Ecr;
}
