import { FormikErrors } from 'formik';
import { useMemo } from 'react';

import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { StorageClass } from '@/react/portainer/environments/types';
import { KubernetesApplicationTypes } from '@/kubernetes/models/application/models';

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
    <FormSection
      title="Persisted folders"
      titleSize="sm"
      titleClassName="control-label !text-[0.9em]"
    >
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
        isDeleteButtonHidden={isDeleteButtonHidden()}
        deleteButtonDataCy="k8sAppCreate-persistentFolderRemoveButton"
        addButtonDataCy="k8sAppCreate-persistentFolderAddButton"
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
          persistentVolumeClaimName:
            availableVolumes[0]?.PersistentVolumeClaim.Name || '',
          containerPath: '',
          size: '',
          sizeUnit: 'GB',
          storageClass: storageClasses[0],
          useNewVolume: true,
          existingVolume: undefined,
          needsDeletion: false,
        })}
        addLabel="Add persisted folder"
        canUndoDelete={isEdit}
      />
    </FormSection>
  );

  function isDeleteButtonHidden() {
    return (
      (isEdit &&
        applicationValues.ApplicationType ===
          KubernetesApplicationTypes.STATEFULSET) ||
      applicationValues.Containers.length >= 1
    );
  }
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
