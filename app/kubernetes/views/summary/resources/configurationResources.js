import { KubernetesResourceTypes, KubernetesResourceActions } from 'Kubernetes/models/resource-types/models';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

const { CREATE, UPDATE } = KubernetesResourceActions;

export default function (formValues) {
  const action = formValues.Id ? UPDATE : CREATE;
  if (formValues.Type === KubernetesConfigurationTypes.CONFIGMAP) {
    return [{ action, kind: KubernetesResourceTypes.CONFIGMAP, name: formValues.Name }];
  } else if (formValues.Type === KubernetesConfigurationTypes.SECRET) {
    return [{ action, kind: KubernetesResourceTypes.SECRET, name: formValues.Name }];
  }
}
