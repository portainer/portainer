import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { parseKubernetesAxiosError } from '../axiosError';

interface SelfSubjectAccessReviewResponse {
  status: {
    allowed: boolean;
  };
  spec: {
    resourceAttributes: {
      namespace: string;
    };
  };
}

/**
 * getSelfSubjectAccessReview is used to retrieve the self subject access review for a given namespace.
 * It's great to use this to determine if a user has access to a namespace.
 * @returns the self subject access review for the given namespace
 * */
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
    throw parseKubernetesAxiosError(
      e,
      'Unable to retrieve self subject access review'
    );
  }
}
