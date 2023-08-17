import { Container } from 'kubernetes-types/core/v1';

export interface ContainerRowData extends Container {
  podName: string;
  nodeName: string;
  podIp: string;
  creationDate: string;
  status: string;
}
