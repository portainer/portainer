import axios, { parseAxiosError } from '@/portainer/services/axios';

interface GenerateUrlResponse {
  edgeKey: string;
}

export async function generateKey() {
  try {
    const { data } = await axios.post<GenerateUrlResponse>(
      `/endpoints/edge/generate-key`
    );
    return data.edgeKey;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to generate key');
  }
}
