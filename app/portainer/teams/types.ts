import { UserId } from '../users/types';

export type TeamId = number;

export enum Role {
  TeamLeader = 1,
  TeamMember,
}

export interface Team {
  Id: TeamId;
  Name: string;
}

export interface TeamMembership {
  Id: number;
  UserID: UserId;
  TeamID: TeamId;
  Role: Role;
}
