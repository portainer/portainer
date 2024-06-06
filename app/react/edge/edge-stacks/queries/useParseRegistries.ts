import { useMutation } from '@tanstack/react-query';

import { withError } from '@/react-tools/react-query';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import axios, {
  json2formData,
  parseAxiosError,
} from '@/portainer/services/axios';

import { buildUrl } from './buildUrl';

export function useParseRegistries() {
  return useMutation(parseRegistries, {
    ...withError('Failed parsing registries'),
  });
}

export async function parseRegistries({
  file,
  fileContent,
}: {
  file?: File;
  fileContent?: string;
}) {
  if (!file && !fileContent) {
    throw new Error('File or fileContent must be provided');
  }

  let currentFile = file;
  if (!file && fileContent) {
    currentFile = new File([fileContent], 'registries.yml');
  }
  try {
    const { data } = await axios.post<Array<RegistryId>>(
      buildUrl(undefined, 'parse_registries'),
      json2formData({ file: currentFile }),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
