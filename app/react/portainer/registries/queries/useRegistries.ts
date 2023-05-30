import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { Registry } from '../types';

import { queryKeys } from './queryKeys';

export function useRegistries() {
  return useQuery(queryKeys.registries(), getRegistries);
}

async function getRegistries() {
  try {
    const response = await axios.get<Array<Registry>>('/registries');
    return response.data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve registries');
  }
}
