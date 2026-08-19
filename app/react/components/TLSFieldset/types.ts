export interface TLSConfig {
  tls: boolean;
  skipVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
}
