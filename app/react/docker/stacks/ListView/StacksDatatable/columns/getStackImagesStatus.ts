import axios, { parseAxiosError } from '@/portainer/services/axios';
import { ImageStatus } from '@/react/docker/components/ImageStatus/types';

export async function getStackImagesStatus(id: number) {
  try {
    const { data } = await axios.get<ImageStatus>(
      `/stacks/${id}/images_status`
    );
    return data;
  } catch (e) {
    throw parseAxiosError(
      e,
      `Unable to retrieve image status for stack: ${id}`
    );
  }
}
