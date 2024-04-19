import { useQuery } from '@tanstack/react-query';

import { Environment } from '@/react/portainer/environments/types';
import { Registry } from '@/react/portainer/registries/types/registry';

import { manifestsToTag } from '../ItemView/TagsDatatable/manifestsToTag';
import { RepositoryTagViewModel } from '../ItemView/TagsDatatable/view-model';

import { getTagManifestV1, getTagManifestV2 } from './manifest.service';
import { ImageConfigs, getRegistryBlob } from './getRegistryBlobs';
import { queryKeys } from './queryKeys';

interface Params {
  registryId: Registry['Id'];
  repository: string;
  environmentId?: Environment['Id'];
  tag: string;
}

export function useTagDetails<T = RepositoryTagViewModel>(
  params: Params,
  {
    staleTime = 0,
    select,
  }: { select?: (model: RepositoryTagViewModel) => T; staleTime?: number } = {}
) {
  return useQuery({
    queryKey: queryKeys.tagDetails(params),
    queryFn: () => getTagDetails(params),
    staleTime,
    select,
  });
}

export async function getTagDetails({
  registryId,
  environmentId,
  repository,
  tag,
}: Params) {
  const params = {
    id: registryId,
    endpointId: environmentId,
    repository,
    tag,
  };
  const [v1, v2] = await Promise.all([
    getTagManifestV1(params),
    getTagManifestV2(params),
  ]);

  let useV1 = true;
  let imageConfigs: ImageConfigs | undefined;
  try {
    imageConfigs = await getRegistryBlob({
      digest: v2.config.digest,
      ...params,
    });

    // prefer image configs than manifest v1
    useV1 = false;
  } catch (e) {
    // empty
  }

  if (v1 && v1.schemaVersion === 2) {
    // Registry returns manifest v2 while we request manifest v1
    useV1 = false;
  }

  const data: { v2: typeof v2; v1?: typeof v1; imageConfigs?: ImageConfigs } = {
    v2,
    imageConfigs,
  };
  if (useV1) {
    data.v1 = v1;
  }

  const tagDetails = manifestsToTag(data);
  tagDetails.Name = tagDetails.Name || tag;
  return tagDetails;
}
