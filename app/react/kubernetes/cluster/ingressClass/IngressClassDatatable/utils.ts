import { IngressControllerClassMap } from '../types';

export function getIngressClassesFormValues(
  allowNoneIngressClass: boolean,
  ingressClasses?: IngressControllerClassMap[]
) {
  const ingressClassesFormValues = ingressClasses ? [...ingressClasses] : [];
  const noneIngressClassIndex = ingressClassesFormValues.findIndex(
    (ingressClass) =>
      ingressClass.Name === 'none' &&
      ingressClass.ClassName === 'none' &&
      ingressClass.Type === 'custom'
  );
  // add the none ingress class if it doesn't exist
  if (allowNoneIngressClass && noneIngressClassIndex === -1) {
    return [
      ...ingressClassesFormValues,
      {
        Name: 'none',
        ClassName: 'none',
        Type: 'custom',
        Availability: true,
        New: false,
        Used: false,
      },
    ];
  }
  // remove the none ingress class if it exists
  if (!allowNoneIngressClass && noneIngressClassIndex > -1) {
    return [
      ...ingressClassesFormValues.slice(0, noneIngressClassIndex),
      ...ingressClassesFormValues.slice(noneIngressClassIndex + 1),
    ];
  }
  // otherwise return the ingress classes as is
  return ingressClassesFormValues;
}
