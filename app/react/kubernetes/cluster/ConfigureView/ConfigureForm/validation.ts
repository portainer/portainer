import { object, string, boolean, array, number, SchemaOf } from 'yup';

import { IngressControllerClassMap } from '../../ingressClass/types';

import { ConfigureFormValues } from './types';

// Define Yup schema for AccessMode
const accessModeSchema = object().shape({
  Description: string().required(),
  Name: string().required(),
  selected: boolean().required(),
});

// Define Yup schema for StorageClassFormValues
const storageClassFormValuesSchema = array()
  .of(
    object().shape({
      Name: string().required(),
      AccessModes: array().of(accessModeSchema).required(),
      Provisioner: string().required(),
      AllowVolumeExpansion: boolean().required(),
      selected: boolean().required(),
    })
  )
  .test(
    // invalid if any storage class is not selected or if it's selected and at least one access mode is selected
    'accessModes',
    'Shared access policy configuration required.',
    (storageClasses) => {
      const isValid = storageClasses?.every(
        (value) =>
          !value.selected ||
          value.AccessModes?.some((accessMode) => accessMode.selected)
      );
      return isValid || false;
    }
  );

// Define Yup schema for IngressControllerClassMap
const ingressControllerClassMapSchema: SchemaOf<IngressControllerClassMap> =
  object().shape({
    Name: string().required(),
    ClassName: string().required(),
    Type: string().required(),
    Availability: boolean().required(),
    New: boolean().required(),
    Used: boolean().required(),
  });

// Define Yup schema for ConfigureFormValues
export const configureValidationSchema: SchemaOf<ConfigureFormValues> = object({
  useLoadBalancer: boolean().required(),
  useServerMetrics: boolean().required(),
  enableResourceOverCommit: boolean().required(),
  resourceOverCommitPercentage: number().required(),
  restrictDefaultNamespace: boolean().required(),
  restrictStandardUserIngressW: boolean().required(),
  ingressAvailabilityPerNamespace: boolean().required(),
  allowNoneIngressClass: boolean().required(),
  storageClasses: storageClassFormValuesSchema.required(),
  ingressClasses: array().of(ingressControllerClassMapSchema).required(),
});
