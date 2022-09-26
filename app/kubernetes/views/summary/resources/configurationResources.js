import { KubernetesResourceTypes, KubernetesResourceActions } from 'Kubernetes/models/resource-types/models';
import { KubernetesConfigurationKinds } from 'Kubernetes/models/configuration/models';

const { CREATE, UPDATE } = KubernetesResourceActions;

export default function (formValues) {
  const action = formValues.Id ? UPDATE : CREATE;
  if (formValues.Kind === KubernetesConfigurationKinds.CONFIGMAP) {
    return [{ action, kind: KubernetesResourceTypes.CONFIGMAP, name: formValues.Name }];
  } else if (formValues.Kind === KubernetesConfigurationKinds.SECRET) {
    let type = typeof formValues.Type === 'string' ? formValues.Type : formValues.Type.name;
    if (formValues.customType) {
      type = formValues.customType;
    }
    return [{ action, kind: KubernetesResourceTypes.SECRET, name: formValues.Name, type }];
  }
}
