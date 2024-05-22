import { getSecret } from '@/react/docker/proxy/queries/secrets/useSecret';
import { getSecrets } from '@/react/docker/proxy/queries/secrets/useSecrets';
import { removeSecret } from '@/react/docker/proxy/queries/secrets/useRemoveSecretMutation';
import { createSecret } from '@/react/docker/proxy/queries/secrets/useCreateSecretMutation';

import { SecretViewModel } from '../models/secret';

angular.module('portainer.docker').factory('SecretService', SecretServiceFactory);

/* @ngInject */
function SecretServiceFactory(AngularToReact) {
  return {
    secret: AngularToReact.useAxios(secretAngularJS), // secret edit
    secrets: AngularToReact.useAxios(secretsAngularJS), // secret list + service create + service edit
    remove: AngularToReact.useAxios(removeSecret), // secret list + secret edit
    create: AngularToReact.useAxios(createSecret), // secret create
  };

  async function secretAngularJS(environmentId, id) {
    const data = await getSecret(environmentId, id);
    return new SecretViewModel(data);
  }

  async function secretsAngularJS(environmentId) {
    const data = await getSecrets(environmentId);
    return data.map((s) => new SecretViewModel(s));
  }
}
