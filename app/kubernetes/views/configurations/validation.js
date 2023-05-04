import { KubernetesSecretTypeOptions } from '@/kubernetes/models/configuration/models';
import { KubernetesConfigurationKinds } from '@/kubernetes/models/configuration/models';

export function isConfigurationFormValid(alreadyExist, isDataValid, formValues) {
  const uniqueCheck = !alreadyExist && isDataValid;
  let secretWarningMessage = '';
  let isFormValid = false;

  if (formValues.IsSimple) {
    if (formValues.Kind === KubernetesConfigurationKinds.SECRET) {
      let isSecretDataValid = true;

      switch (formValues.Type) {
        case KubernetesSecretTypeOptions.SERVICEACCOUNTTOKEN.value:
          // data isn't required for service account tokens
          isFormValid = uniqueCheck && formValues.ResourcePool;
          return [isFormValid, ''];
        case KubernetesSecretTypeOptions.DOCKERCFG.value:
          // needs to contain a .dockercfg key
          isSecretDataValid = formValues.Data.some((entry) => entry.Key === '.dockercfg');
          secretWarningMessage = isSecretDataValid ? '' : 'A data entry with a .dockercfg key is required.';
          break;
        case KubernetesSecretTypeOptions.DOCKERCONFIGJSON.value:
          // needs to contain a .dockerconfigjson key
          isSecretDataValid = formValues.Data.some((entry) => entry.Key === '.dockerconfigjson');
          secretWarningMessage = isSecretDataValid ? '' : 'A data entry with a .dockerconfigjson key. is required.';
          break;
        case KubernetesSecretTypeOptions.BASICAUTH.value:
          isSecretDataValid = formValues.Data.some((entry) => entry.Key === 'username' || entry.Key === 'password');
          secretWarningMessage = isSecretDataValid ? '' : 'A data entry with a username or password key is required.';
          break;
        case KubernetesSecretTypeOptions.SSHAUTH.value:
          isSecretDataValid = formValues.Data.some((entry) => entry.Key === 'ssh-privatekey');
          secretWarningMessage = isSecretDataValid ? '' : `A data entry with a 'ssh-privatekey' key is required.`;
          break;
        case KubernetesSecretTypeOptions.TLS.value:
          isSecretDataValid = formValues.Data.some((entry) => entry.Key === 'tls.crt') && formValues.Data.some((entry) => entry.Key === 'tls.key');
          secretWarningMessage = isSecretDataValid ? '' : `Data entries containing a 'tls.crt' key and a 'tls.key' key are required.`;
          break;
        case KubernetesSecretTypeOptions.BOOTSTRAPTOKEN.value:
          isSecretDataValid = formValues.Data.some((entry) => entry.Key === 'token-id') && formValues.Data.some((entry) => entry.Key === 'token-secret');
          secretWarningMessage = isSecretDataValid ? '' : `Data entries containing a 'token-id' key and a 'token-secret' key are required.`;
          break;
        default:
          break;
      }

      isFormValid = uniqueCheck && formValues.ResourcePool && formValues.Data.length >= 1 && isSecretDataValid;
      return [isFormValid, secretWarningMessage];
    }

    isFormValid = formValues.Data.length > 0 && uniqueCheck && formValues.ResourcePool;
    return [isFormValid, secretWarningMessage];
  }

  isFormValid = uniqueCheck && formValues.ResourcePool;
  return [isFormValid, secretWarningMessage];
}
