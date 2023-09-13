import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from '../../proxy/queries/build-url';

import { queryKeys } from './queryKeys';

interface ImageSummary {
  /**
   * Number of containers using this image. Includes both stopped and running	containers.
   *
   * This size is not calculated by default, and depends on which API endpoint is used.
   * `-1` indicates that the value has not been set / calculated.
   *
   * Required: true
   */
  Containers: number;

  /**
   * Date and time at which the image was created as a Unix timestamp
   * (number of seconds sinds EPOCH).
   *
   * Required: true
   */
  Created: number;

  /**
   * ID is the content-addressable ID of an image.
   *
   * This identifier is a content-addressable digest calculated from the
   * image's configuration (which includes the digests of layers used by
   * the image).
   *
   * Note that this digest differs from the `RepoDigests` below, which
   * holds digests of image manifests that reference the image.
   *
   * 	Required: true
   */
  Id: string;

  /**
   * User-defined key/value metadata.
   * Required: true
   */
  Labels: { [key: string]: string };

  /**
   * ID of the parent image.
   *
   * Depending on how the image was created, this field may be empty and
   * is only set for images that were built/created locally. This field
   * is empty if the image was pulled from an image registry.
   *
   * Required: true
   */
  ParentId: string;

  /**
   * List of content-addressable digests of locally available image manifests
   * that the image is referenced from. Multiple manifests can refer to the
   * same image.
   *
   * These digests are usually only available if the image was either pulled
   * from a registry, or if the image was pushed to a registry, which is when
   * the manifest is generated and its digest calculated.
   *
   * Required: true
   */
  RepoDigests: string[];

  /**
   * List of image names/tags in the local image cache that reference this
   * image.
   *
   * Multiple image tags can refer to the same image, and this list may be
   * empty if no tags reference the image, in which case the image is
   * "untagged", in which case it can still be referenced by its ID.
   *
   * Required: true
   */
  RepoTags: string[];

  /**
   * Total size of image layers that are shared between this image and other
   * images.
   *
   * This size is not calculated by default. `-1` indicates that the value
   * has not been set / calculated.
   *
   * Required: true
   */
  SharedSize: number;
  Size: number;
  VirtualSize: number;
}

type ImagesListResponse = ImageSummary[];

export function useImages<T = ImagesListResponse>(
  environmentId: EnvironmentId,
  {
    select,
    enabled,
  }: { select?(data: ImagesListResponse): T; enabled?: boolean } = {}
) {
  return useQuery(
    queryKeys.list(environmentId),
    () => getImages(environmentId),
    { select, enabled }
  );
}

async function getImages(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<ImagesListResponse>(
      buildUrl(environmentId, 'images', 'json')
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to retrieve images');
  }
}
