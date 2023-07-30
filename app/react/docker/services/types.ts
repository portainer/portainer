export type ServiceId = string;

export interface DockerServiceResponse {
  ID: string;
  Spec: {
    Name: string;
  };
}

export type ServiceLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};
