import { SchemaOf, array, boolean, object, string } from 'yup';
import filesizeParser from 'filesize-parser';
import _ from 'lodash';

import { StorageClass } from '@/react/portainer/environments/types';

import { buildUniquenessTest } from '@@/form-components/validate-unique';

import { ExistingVolume, PersistedFolderFormValue } from './types';

type FormData = {
  namespaceQuotas: unknown;
  persistedFolders: PersistedFolderFormValue[];
  storageAvailabilities: Record<string, number>;
};

export function persistedFoldersValidation(
  formData?: FormData
): SchemaOf<PersistedFolderFormValue[]> {
  return array(
    object({
      persistentVolumeClaimName: string(),
      containerPath: string().required('Path is required.'),
      size: string().when('useNewVolume', {
        is: true,
        then: string()
          .test(
            'quotaExceeded',
            'Requested size exceeds available quota for this storage class.',
            // eslint-disable-next-line prefer-arrow-callback, func-names
            function (this) {
              const persistedFolderFormValue = this
                .parent as PersistedFolderFormValue;
              const quota = formData?.namespaceQuotas;
              let quotaExceeded = false;
              if (quota) {
                const pfs = formData?.persistedFolders;
                const groups = _.groupBy(pfs, 'storageClass.Name');
                _.forOwn(groups, (storagePfs, storageClassName) => {
                  if (
                    storageClassName ===
                    persistedFolderFormValue.storageClass.Name
                  ) {
                    const newPfs = _.filter(storagePfs, {
                      persistentVolumeClaimName: '',
                    });
                    const requestedSize = _.reduce(
                      newPfs,
                      (sum, pf) =>
                        pf.useNewVolume && pf.size
                          ? sum +
                            filesizeParser(`${pf.size}${pf.sizeUnit}`, {
                              base: 10,
                            })
                          : sum,
                      0
                    );
                    if (
                      formData?.storageAvailabilities[storageClassName] <
                      requestedSize
                    ) {
                      quotaExceeded = true;
                    }
                  }
                });
              }
              return !quotaExceeded;
            }
          )
          .required('Size is required.'),
      }),
      sizeUnit: string().when('useNewVolume', {
        is: true,
        then: string().required('Size unit is required.'),
      }),
      storageClass: storageClassValidation(),
      useNewVolume: boolean().required(),
      existingVolume: existingVolumeValidation().nullable(),
      needsDeletion: boolean(),
    })
  ).test(
    'containerPath',
    'This path is already defined.',
    buildUniquenessTest(() => 'This path is already defined.', 'containerPath')
  );
}

function storageClassValidation(): SchemaOf<StorageClass> {
  return object({
    Name: string().required(),
    AccessModes: array(string().required()).required(),
    AllowVolumeExpansion: boolean().required(),
    Provisioner: string().required(),
  });
}

function existingVolumeValidation(): SchemaOf<ExistingVolume> {
  return object({
    PersistentVolumeClaim: object({
      Id: string().required(),
      Name: string().required(),
      Namespace: string().required(),
      Storage: string().required(),
      storageClass: storageClassValidation(),
      CreationDate: string().required(),
      ApplicationOwner: string(),
      ApplicationName: string(),
      PreviousName: string(),
      MountPath: string(),
      Yaml: string(),
    }),
  });
}
