export interface Motd {
  Title: string;
  Message: string;
  Hash: string;
  Style?: string;
  ContentLayout?: Record<string, string>;
}

export interface Filter {
  value: number;
  label: string;
}
