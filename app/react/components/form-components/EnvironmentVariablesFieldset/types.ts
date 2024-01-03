export interface EnvVar {
  name: string;
  value?: string;
  needsDeletion?: boolean;
}

export type EnvVarValues = Array<EnvVar>;
