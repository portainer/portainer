import { object, SchemaOf, string } from 'yup';

import { Values } from './types';
import { hostnameSchema } from './HostnameField';
import { hostFileSchema } from './HostsFileEntries';

export function validation(): SchemaOf<Values> {
  return object({
    networkMode: string().default(''),
    hostname: hostnameSchema,
    domain: string().default(''),
    macAddress: string().default(''),
    ipv4Address: string().default(''),
    ipv6Address: string().default(''),
    primaryDns: string().default(''),
    secondaryDns: string().default(''),
    hostsFileEntries: hostFileSchema,
    container: string()
      .default('')
      .when('network', {
        is: 'container',
        then: string().required('Container is required'),
      }),
  });
}
