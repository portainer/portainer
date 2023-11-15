import { useMutation } from 'react-query';

import { withError } from '@/react-tools/react-query';
import { RegistryId } from '@/react/portainer/registries/types';
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

export async function parseRegistries(props: {
  file?: File;
  fileContent?: string;
}) {
  if (!props.file && !props.fileContent) {
    throw new Error('File or fileContent must be provided');
  }

  let currentFile = props.file;
  if (!props.file && props.fileContent) {
    currentFile = new File([props.fileContent], 'registries.yml');
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
