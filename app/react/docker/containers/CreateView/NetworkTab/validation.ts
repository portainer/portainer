import { array, object, SchemaOf, string } from 'yup';

import { Values } from './types';

export function validation(): SchemaOf<Values> {
  return object({
    networkMode: string().default(''),
    hostname: string().default(''),
    domain: string().default(''),
    macAddress: string().default(''),
    ipv4Address: string().default(''),
    ipv6Address: string().default(''),
    primaryDns: string().default(''),
    secondaryDns: string().default(''),
    hostsFileEntries: array(string().required('Entry is required')).default([]),
    container: string()
      .default('')
      .when('network', {
        is: 'container',
        then: string().required('Container is required'),
      }),
  });
}
