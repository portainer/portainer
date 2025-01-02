import { getSecret } from '@/react/docker/proxy/queries/secrets/useSecret';
import { getSecrets } from '@/react/docker/proxy/queries/secrets/useSecrets';
import { removeSecret } from '@/react/docker/proxy/queries/secrets/useRemoveSecretMutation';
import { createSecret } from '@/react/docker/proxy/queries/secrets/useCreateSecretMutation';

import { SecretViewModel } from '../models/secret';

angular.module('portainer.docker').factory('SecretService', SecretServiceFactory);

/* @ngInject */
function SecretServiceFactory(AngularToReact) {
  const { useAxios, injectEnvironmentId } = AngularToReact;

  return {
    secret: useAxios(injectEnvironmentId(secretAngularJS)), // secret edit
    secrets: useAxios(injectEnvironmentId(secretsAngularJS)), // secret list + service create + service edit
    remove: useAxios(injectEnvironmentId(removeSecret)), // secret list + secret edit
    create: useAxios(injectEnvironmentId(createSecret)), // secret create
  };

  /**
   * @param {EnvironmentId} environmentId Injected
   * @param {SecretId} id
   */
  async function secretAngularJS(environmentId, id) {
    const data = await getSecret(environmentId, id);
    return new SecretViewModel(data);
  }

  /**
   * @param {EnvironmentId} environmentId Injected
   */
  async function secretsAngularJS(environmentId) {
    const data = await getSecrets(environmentId);
    return data.map((s) => new SecretViewModel(s));
  }
}
