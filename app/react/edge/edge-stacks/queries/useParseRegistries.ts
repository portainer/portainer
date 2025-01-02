import { useMutation } from '@tanstack/react-query';

import { RegistryId } from '@/react/portainer/registries/types/registry';
import axios, {
  json2formData,
  parseAxiosError,
} from '@/portainer/services/axios';

import { buildUrl } from './buildUrl';

export function useParseRegistries() {
  return useMutation(
    parseRegistries
    // handle errors in the calling function (notifyError vs setting form errors in validation)
  );
}

export async function parseRegistries({
  file,
  fileContent,
}: {
  file?: File;
  fileContent?: string;
}) {
  if (!file && !fileContent) {
    return [];
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
