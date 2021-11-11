export type EndpointId = number;

export enum EndpointStatus {
  Up = 1,
  Down = 2,
}

export interface Endpoint {
  Id: EndpointId;
  Status: EndpointStatus;
  PublicURL: string;
}
