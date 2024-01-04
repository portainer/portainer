export interface EnvVar {
  name: string;
  value?: string;
  needsDeletion?: boolean;
}

export type Value = Array<EnvVar>;
