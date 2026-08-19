import { KubernetesResourceTypes, KubernetesResourceActions } from '@/kubernetes/models/resource-types/models';
import { KubernetesConfigurationKinds } from '@/kubernetes/models/configuration/models';

const { CREATE, UPDATE } = KubernetesResourceActions;

export default function (formValues) {
  const action = formValues.Id ? UPDATE : CREATE;
  if (formValues.Kind === KubernetesConfigurationKinds.CONFIGMAP) {
    return [{ action, kind: KubernetesResourceTypes.CONFIGMAP, name: formValues.Name }];
  } else if (formValues.Kind === KubernetesConfigurationKinds.SECRET) {
    let type = formValues.Type;
    if (formValues.customType) {
      type = formValues.customType;
    }
    return [{ action, kind: KubernetesResourceTypes.SECRET, name: formValues.Name, type }];
  }
}
