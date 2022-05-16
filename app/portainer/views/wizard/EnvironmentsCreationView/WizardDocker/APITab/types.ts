export interface FormValues {
  name: string;
  url: string;
  tls: boolean;
  skipVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
}
