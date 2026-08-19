import { type UserId } from '@/portainer/users/types';

export type TeamId = number;

export enum TeamRole {
  Leader = 1,
  Member,
}

export type Team = {
  Id: TeamId;
  Name: string;
};

export type TeamMembershipId = number;

export interface TeamMembership {
  Id: TeamMembershipId;
  Role: TeamRole;
  UserID: UserId;
  TeamID: TeamId;
}
