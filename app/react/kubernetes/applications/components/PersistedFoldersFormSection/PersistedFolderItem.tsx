import clsx from 'clsx';

import { StorageClass } from '@/react/portainer/environments/types';

import { ItemError } from '@@/form-components/InputList/InputList';
import { Option } from '@@/form-components/PortainerSelect';
import { InputGroup } from '@@/form-components/InputGroup';
import { Select } from '@@/form-components/ReactSelect';
import { Input } from '@@/form-components/Input';
import { isErrorType } from '@@/form-components/formikUtils';
import { FormError } from '@@/form-components/FormError';
import { ButtonSelector } from '@@/form-components/ButtonSelector/ButtonSelector';

import { ApplicationFormValues } from '../../types';

import { ExistingVolume, PersistedFolderFormValue } from './types';

type Props = {
  initialValues?: PersistedFolderFormValue[];
  item: PersistedFolderFormValue;
  onChange: (value: PersistedFolderFormValue) => void;
  error: ItemError<PersistedFolderFormValue>;
  storageClasses: StorageClass[];
  index: number;
  PVCOptions: Option<string>[];
  availableVolumes: ExistingVolume[];
  isEdit: boolean;
  applicationValues: ApplicationFormValues;
};

export function PersistedFolderItem({
  initialValues,
  item,
  onChange,
  error,
  storageClasses,
  index,
  PVCOptions,
  availableVolumes,
  isEdit,
  applicationValues,
}: Props) {
  // rule out the error being of type string
  const formikError = isErrorType(error) ? error : undefined;

  return (
    <div className="flex flex-wrap items-start gap-x-2 gap-y-2">
      <div>
        <InputGroup
          size="small"
          className={clsx('min-w-[250px]', item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon required>Path in container</InputGroup.Addon>
          <Input
            type="text"
            placeholder="e.g. /data"
            disabled={
              (isEdit && isExistingPersistedFolder()) ||
              applicationValues.Containers.length > 1
            }
            value={item.containerPath}
            onChange={(e) =>
              onChange({
                ...item,
                containerPath: e.target.value,
              })
            }
            data-cy={`k8sAppCreate-containerPathInput_${index}`}
          />
        </InputGroup>
        {formikError?.containerPath && (
          <FormError>{formikError?.containerPath}</FormError>
        )}
      </div>
      {isToggleVolumeTypeVisible() && (
        <ButtonSelector<boolean>
          onChange={(isNewVolume) =>
            onChange({
              ...item,
              useNewVolume: isNewVolume,
              size: isNewVolume ? item.size : '',
              existingVolume: isNewVolume ? undefined : availableVolumes[0],
            })
          }
          value={item.useNewVolume}
          options={[
            { value: true, label: 'New volume' },
            {
              value: false,
              label: 'Existing volume',
              disabled: PVCOptions.length === 0,
            },
          ]}
        />
      )}
      {item.useNewVolume && (
        <>
          <div>
            <InputGroup
              size="small"
              className={clsx(
                'flex min-w-fit',
                item.needsDeletion && 'striked'
              )}
            >
              <InputGroup.Addon className="min-w-fit" required>
                Requested size
              </InputGroup.Addon>
              <Input
                className="-mr-[1px] !w-20 !rounded-none"
                type="number"
                placeholder="e.g. 20"
                min="0"
                disabled={
                  (isEdit && isExistingPersistedFolder()) ||
                  applicationValues.Containers.length > 1
                }
                value={item.size}
                onChange={(e) =>
                  onChange({
                    ...item,
                    size: e.target.value,
                  })
                }
                data-cy={`k8sAppCreate-persistentFolderSizeInput_${index}`}
              />
              <Select<Option<string>>
                size="sm"
                className="min-w-fit"
                options={[
                  { label: 'MB', value: 'MB' },
                  { label: 'GB', value: 'GB' },
                  { label: 'TB', value: 'TB' },
                ]}
                value={{
                  label: item.sizeUnit ?? '',
                  value: item.sizeUnit ?? '',
                }}
                onChange={(option) =>
                  onChange({ ...item, sizeUnit: option?.value ?? 'GB' })
                }
                isDisabled={
                  (isEdit && isExistingPersistedFolder()) ||
                  applicationValues.Containers.length > 1
                }
                data-cy={`k8sAppCreate-persistentFolderSizeUnitSelect_${index}`}
                id={`k8sAppCreate-persistentFolderSizeUnitSelect_${index}`}
              />
            </InputGroup>
            {formikError?.size && <FormError>{formikError?.size}</FormError>}
          </div>
          <InputGroup
            size="small"
            className={clsx(item.needsDeletion && 'striked')}
          >
            <InputGroup.Addon>Storage</InputGroup.Addon>
            <Select<Option<string>>
              className="w-40"
              size="sm"
              options={storageClasses.map((sc) => ({
                label: sc.Name,
                value: sc.Name,
              }))}
              value={getStorageClassValue(storageClasses, item)}
              onChange={(option) =>
                onChange({
                  ...item,
                  storageClass:
                    storageClasses.find((sc) => sc.Name === option?.value) ??
                    storageClasses[0],
                })
              }
              isDisabled={
                (isEdit && isExistingPersistedFolder()) ||
                applicationValues.Containers.length > 1 ||
                storageClasses.length <= 1
              }
              data-cy={`k8sAppCreate-storageSelect_${index}`}
              id={`k8sAppCreate-storageSelect_${index}`}
            />
          </InputGroup>
        </>
      )}
      {!item.useNewVolume && (
        <InputGroup
          size="small"
          className={clsx(item.needsDeletion && 'striked')}
        >
          <InputGroup.Addon>Volume</InputGroup.Addon>
          <Select<Option<string>>
            className="w-[440px]"
            size="sm"
            options={PVCOptions}
            value={PVCOptions.find(
              (pvc) => pvc.value === item.persistentVolumeClaimName
            )}
            onChange={(option) =>
              onChange({
                ...item,
                persistentVolumeClaimName: option?.value,
                existingVolume: availableVolumes.find(
                  (pvc) => pvc.PersistentVolumeClaim.Name === option?.value
                ),
              })
            }
            isDisabled={
              (isEdit && isExistingPersistedFolder()) ||
              applicationValues.Containers.length > 1 ||
              availableVolumes.length < 1
            }
            data-cy={`k8sAppCreate-pvcSelect_${index}`}
            id={`k8sAppCreate-pvcSelect_${index}`}
          />
        </InputGroup>
      )}
    </div>
  );

  function isExistingPersistedFolder() {
    return !!initialValues?.[index]?.persistentVolumeClaimName;
  }

  function isToggleVolumeTypeVisible() {
    return (
      !(isEdit && isExistingPersistedFolder()) && // if it's not an edit of an existing persisted folder
      applicationValues.Containers.length <= 1 // and if there is only one container);
    );
  }
}

function getStorageClassValue(
  storageClasses: StorageClass[],
  persistedFolder: PersistedFolderFormValue
) {
  const matchingClass =
    storageClasses.find(
      (sc) => sc.Name === persistedFolder.storageClass?.Name
    ) ?? storageClasses[0];
  return { label: matchingClass?.Name, value: matchingClass?.Name };
}
