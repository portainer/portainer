import { useMutation } from 'react-query';

import { StackType } from '@/react/common/stacks/types';
import { mutationOptions, withGlobalError } from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { TemplateType } from './types';
import { TemplateViewModel } from './view-model';

export function useFetchTemplateInfoMutation() {
  return useMutation(
    getTemplateInfo,
    mutationOptions(withGlobalError('Unable to fetch template info'))
  );
}

async function getTemplateInfo(template: TemplateViewModel) {
  const fileContent = await fetchFilePreview({
    url: template.Repository.url,
    file: template.Repository.stackfile,
  });

  const type = getCustomTemplateType(template.Type);

  return {
    type,
    fileContent,
  };
}

function getCustomTemplateType(type: TemplateType): StackType {
  switch (type) {
    case TemplateType.SwarmStack:
      return StackType.DockerSwarm;
    case TemplateType.ComposeStack:
      return StackType.DockerCompose;
    default:
      throw new Error(`Unknown supported template type: ${type}`);
  }
}

async function fetchFilePreview({ url, file }: { url: string; file: string }) {
  try {
    const { data } = await axios.post<{ FileContent: string }>(
      '/templates/file',
      { repositoryUrl: url, composeFilePathInRepository: file }
    );
    return data.FileContent;
  } catch (err) {
    throw parseAxiosError(err);
  }
}
