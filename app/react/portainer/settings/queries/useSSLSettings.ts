import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

interface SSLSettings {
  certPath: string;
  keyPath: string;
  caCertPath: string;
  selfSigned: boolean;
  httpEnabled: boolean;
}

export function useSSLSettings() {
  return useQuery<SSLSettings>(['sslSettings'], async () => getSSLSettings());
}

async function getSSLSettings() {
  try {
    const response = await axios.get<SSLSettings>('/ssl');
    return response.data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve SSL settings');
  }
}
