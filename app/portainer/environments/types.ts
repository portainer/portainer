export type EnvironmentId = number;

export enum EnvironmentStatus {
  Up = 1,
  Down = 2,
}

export type Environment = {
  Id: EnvironmentId;
  Name: string;
  Status: EnvironmentStatus;
  PublicURL: string;
}
