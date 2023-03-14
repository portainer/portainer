export interface Filter<T = number> {
  value: T;
  label: string;
}

export enum ConnectionType {
  API,
  Agent,
  EdgeAgentStandard,
  EdgeAgentAsync,
}
