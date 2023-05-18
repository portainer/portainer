import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Namespaces, SelfSubjectAccessReviewResponse } from './types';

// getNamespace is used to retrieve a namespace using the Portainer backend
export async function getNamespace(
  environmentId: EnvironmentId,
  namespace: string
) {
  try {
    const { data: ns } = await axios.get<Namespaces>(
      buildUrl(environmentId, namespace)
    );
    return ns;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve namespace');
  }
}

// getNamespaces is used to retrieve namespaces using the Portainer backend with caching
export async function getNamespaces(environmentId: EnvironmentId) {
  try {
    const { data: namespaces } = await axios.get<Namespaces>(
      buildUrl(environmentId)
    );
    return namespaces;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to retrieve namespaces');
  }
}

export async function getSelfSubjectAccessReview(
  environmentId: EnvironmentId,
  namespaceName: string,
  verb = 'list',
  resource = 'deployments',
  group = 'apps'
) {
  try {
    const { data: accessReview } =
      await axios.post<SelfSubjectAccessReviewResponse>(
        `endpoints/${environmentId}/kubernetes/apis/authorization.k8s.io/v1/selfsubjectaccessreviews`,
        {
          spec: {
            resourceAttributes: {
              group,
              resource,
              verb,
              namespace: namespaceName,
            },
          },
          apiVersion: 'authorization.k8s.io/v1',
          kind: 'SelfSubjectAccessReview',
        }
      );
    return accessReview;
  } catch (e) {
    throw parseAxiosError(
      e as Error,
      'Unable to retrieve self subject access review'
    );
  }
}

function buildUrl(environmentId: EnvironmentId, namespace?: string) {
  let url = `kubernetes/${environmentId}/namespaces`;

  if (namespace) {
    url += `/${namespace}`;
  }

  return url;
}
