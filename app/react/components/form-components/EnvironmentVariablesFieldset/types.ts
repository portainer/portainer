export interface EnvVar {
  name: string;
  value?: string;
}

export type Value = Array<EnvVar>;
