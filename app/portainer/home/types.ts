export interface Motd {
  Title: string;
  Message: string;
  Hash: string;
  Style?: string;
  ContentLayout?: Record<string, string>;
}

export interface Filter<T = number> {
  value: T;
  label: string;
}
