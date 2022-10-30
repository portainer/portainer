import axios, { parseAxiosError } from '@/portainer/services/axios';

interface PreviewPayload {
  repository: string;
  targetFile: string;
  reference?: string;
  username?: string;
  password?: string;
}

export async function getFilePreview(payload: PreviewPayload) {
  try {
    const {
      data: { FileContent },
    } = await axios.post('/gitops/repo/file/preview', payload);
    return FileContent;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to fetch file from git');
  }
}
