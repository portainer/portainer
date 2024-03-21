import { FormikErrors } from 'formik';
import { useMemo } from 'react';
import uuidv4 from 'uuid/v4';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { StorageClass } from '@/react/portainer/environments/types';

import { Option } from '@@/form-components/PortainerSelect';
import { InlineLoader } from '@@/InlineLoader';
import { FormSection } from '@@/form-components/FormSection';
import { InputList } from '@@/form-components/InputList';
import { TextTip } from '@@/Tip/TextTip';

import { ApplicationFormValues } from '../../types';

import { ExistingVolume, PersistedFolderFormValue } from './types';
import { PersistedFolderItem } from './PersistedFolderItem';

type Props = {
  values: PersistedFolderFormValue[];
  initialValues: PersistedFolderFormValue[];
  onChange: (values: PersistedFolderFormValue[]) => void;
  errors: FormikErrors<PersistedFolderFormValue[]>;
  isAddPersistentFolderButtonShown: unknown;
  isEdit: boolean;
  applicationValues: ApplicationFormValues;
  availableVolumes: ExistingVolume[];
};

export function PersistedFoldersFormSection({
  values,
  initialValues,
  onChange,
  errors,
  isAddPersistentFolderButtonShown,
  isEdit,
  applicationValues,
  availableVolumes,
}: Props) {
  const environmentQuery = useCurrentEnvironment();
  const storageClasses =
    environmentQuery.data?.Kubernetes.Configuration.StorageClasses ?? [];
  const PVCOptions = usePVCOptions(availableVolumes);

  return (
    <FormSection title="Persisted folders" titleSize="sm">
      {storageClasses.length === 0 && (
        <TextTip color="blue">
          No storage option is available to persist data, contact your
          administrator to enable a storage option.
        </TextTip>
      )}
      {environmentQuery.isLoading && (
        <InlineLoader>Loading volumes...</InlineLoader>
      )}
      <InputList<PersistedFolderFormValue>
        value={values}
        onChange={onChange}
        errors={errors}
        isDeleteButtonHidden={
          isEdit && applicationValues.ApplicationType === 'StatefulSet'
        }
        canUndoDelete={isEdit}
        data-cy="k8sAppCreate-persistentFolder"
        disabled={storageClasses.length === 0}
        addButtonError={getAddButtonError(storageClasses)}
        isAddButtonHidden={!isAddPersistentFolderButtonShown}
        renderItem={(item, onChange, index, error) => (
          <PersistedFolderItem
            item={item}
            onChange={onChange}
            error={error}
            PVCOptions={PVCOptions}
            availableVolumes={availableVolumes}
            storageClasses={storageClasses ?? []}
            index={index}
            isEdit={isEdit}
            applicationValues={applicationValues}
            initialValues={initialValues}
          />
        )}
        itemBuilder={() => ({
          persistentVolumeClaimName: getNewPVCName(applicationValues.Name),
          containerPath: '',
          size: '',
          sizeUnit: 'GB',
          storageClass: storageClasses[0],
          useNewVolume: true,
          existingVolume: undefined,
          needsDeletion: false,
        })}
        addLabel="Add persisted folder"
      />
    </FormSection>
  );
}

function usePVCOptions(existingPVCs: ExistingVolume[]): Option<string>[] {
  return useMemo(
    () =>
      existingPVCs.map((pvc) => ({
        label: pvc.PersistentVolumeClaim.Name ?? '',
        value: pvc.PersistentVolumeClaim.Name ?? '',
      })),
    [existingPVCs]
  );
}

function getAddButtonError(storageClasses: StorageClass[]) {
  if (storageClasses.length === 0) {
    return 'No storage option available';
  }
  return '';
}

function getNewPVCName(applicationName: string) {
  const name = `${applicationName}-${uuidv4()}`;
  // limit it to 63 characters to avoid exceeding the limit for the volume name
  const nameLimited = name.length > 63 ? name.substring(0, 63) : name;
  return nameLimited;
}
