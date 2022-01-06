export type EnvironmentId = number;

export enum EnvironmentStatus {
  Up = 1,
  Down = 2,
}

export type Environment = {
  Id: EnvironmentId;
  Name: string;
  Group: string;
  Status: EnvironmentStatus;
  PublicURL: string;
}
