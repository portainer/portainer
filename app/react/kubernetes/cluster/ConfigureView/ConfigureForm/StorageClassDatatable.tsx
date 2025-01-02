import { useFormikContext } from 'formik';

import { TextTip } from '@@/Tip/TextTip';
import { Switch } from '@@/form-components/SwitchField/Switch';

import { StorageAccessModeSelector } from './StorageAccessModeSelector';
import { ConfigureFormValues, StorageClassFormValues } from './types';
import { availableStorageClassPolicies } from './useStorageClasses';

type Props = {
  storageClassValues: StorageClassFormValues[];
};

export function StorageClassDatatable({ storageClassValues }: Props) {
  const { setFieldValue } = useFormikContext<ConfigureFormValues>();
  return (
    <div className="form-group">
      <div className="col-sm-12 mt-2.5">
        <table className="table table-fixed">
          <tbody>
            <tr className="text-muted">
              <td>Storage</td>
              <td>Shared access policy</td>
              <td>Volume expansion</td>
            </tr>
            {storageClassValues.map((storageClassValue, index) => (
              <tr
                key={`${storageClassValue.Name}${storageClassValue.Provisioner}`}
              >
                <td>
                  <div className="flex h-full flex-row items-center">
                    <Switch
                      checked={storageClassValue.selected}
                      onChange={(checked) =>
                        setFieldValue(
                          `storageClasses.${index}.selected`,
                          checked
                        )
                      }
                      className="mb-0 mr-2"
                      id={`kubeSetup-storageToggle${storageClassValue.Name}`}
                      name={`kubeSetup-storageToggle${storageClassValue.Name}`}
                      data-cy={`kubeSetup-storageToggle${storageClassValue.Name}`}
                    />
                    <span>{storageClassValue.Name}</span>
                  </div>
                </td>
                <td>
                  <StorageAccessModeSelector
                    options={availableStorageClassPolicies}
                    value={storageClassValue.AccessModes}
                    onChange={(accessModes) => {
                      setFieldValue(
                        `storageClasses.${index}.AccessModes`,
                        accessModes
                      );
                    }}
                    storageClassName={storageClassValue.Name}
                  />
                </td>
                <td>
                  <div className="flex h-full flex-row items-center">
                    <Switch
                      checked={storageClassValue.AllowVolumeExpansion}
                      onChange={(checked) =>
                        setFieldValue(
                          `storageClasses.${index}.AllowVolumeExpansion`,
                          checked
                        )
                      }
                      className="mb-0 mr-2"
                      data-cy={`kubeSetup-storageExpansionToggle${storageClassValue.Name}`}
                      id={`kubeSetup-storageExpansionToggle${storageClassValue.Name}`}
                      name={`kubeSetup-storageExpansionToggle${storageClassValue.Name}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasValidStorageConfiguration(storageClassValues) && (
        <div className="col-sm-12">
          <TextTip color="orange">
            Shared access policy configuration required.
          </TextTip>
        </div>
      )}
    </div>
  );
}

function hasValidStorageConfiguration(
  storageClassValues: StorageClassFormValues[]
) {
  return storageClassValues.every(
    (storageClassValue) =>
      // if the storage class is not selected, it's valid
      !storageClassValue.selected ||
      // if the storage class is selected, it must have at least one access mode
      storageClassValue.AccessModes.length > 0
  );
}
