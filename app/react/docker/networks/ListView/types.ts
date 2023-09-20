import { IPAMConfig } from 'docker-types/generated/1.41';

import { NetworkViewModel } from '@/docker/models/network';

export type DecoratedNetwork = NetworkViewModel & {
  Subs?: DecoratedNetwork[];
  IPAM: NetworkViewModel['IPAM'] & {
    IPV4Configs?: Array<IPAMConfig>;
    IPV6Configs?: Array<IPAMConfig>;
  };
};
