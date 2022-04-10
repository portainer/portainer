import axios, { parseAxiosError } from '@/portainer/services/axios';

interface GenerateUrlResponse {
  edgeKey: string;
}

export async function generateKey(portainerUrl: string) {
  try {
    const { data } = await axios.post<GenerateUrlResponse>(
      `/endpoints/edge/generate-key`,
      { portainerUrl }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to generate key');
  }
}
