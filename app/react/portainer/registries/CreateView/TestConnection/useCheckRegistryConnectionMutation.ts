import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

interface RegistryPingPayload {
  Username: string;
  Password: string;
  Type: number;
  URL?: string;
  TLS?: boolean;
}

interface RegistryPingResponse {
  success: boolean;
  message: string;
}

async function pingRegistry(
  payload: RegistryPingPayload
): Promise<RegistryPingResponse> {
  try {
    const { data } = await axios.post<RegistryPingResponse>(
      '/registries/ping',
      payload
    );
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useCheckRegistryConnectionMutation() {
  return useMutation({
    mutationFn: pingRegistry,
  });
}
