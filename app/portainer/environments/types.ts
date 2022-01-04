export type EnvironmentId = number;

export enum EnvironmentStatus {
  Up = 1,
  Down = 2,
}

export interface Environment {
  Id: EnvironmentId;
  Status: EnvironmentStatus;
  PublicURL: string;
}
