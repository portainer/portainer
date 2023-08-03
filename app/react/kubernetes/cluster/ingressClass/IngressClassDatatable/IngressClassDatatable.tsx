import { useEffect, useState } from 'react';
import { Database, AlertTriangle } from 'lucide-react';

import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { Datatable } from '@@/datatables';
import { Button, ButtonGroup } from '@@/buttons';
import { Icon } from '@@/Icon';
import { createPersistedStore } from '@@/datatables/types';
import { buildConfirmButton } from '@@/modals/utils';
import { useTableState } from '@@/datatables/useTableState';

import { IngressControllerClassMap } from '../types';

import { columns } from './columns';

const storageKey = 'ingressClasses';
const settingsStore = createPersistedStore(storageKey);

interface Props {
  onChangeControllers: (
    controllerClassMap: IngressControllerClassMap[]
  ) => void; // angular function to save the ingress class list
  description: string;
  ingressControllers: IngressControllerClassMap[] | undefined;
  allowNoneIngressClass: boolean;
  isLoading: boolean;
  noIngressControllerLabel: string;
  view: string;
}

export function IngressClassDatatable({
  onChangeControllers,
  description,
  ingressControllers,
  allowNoneIngressClass,
  isLoading,
  noIngressControllerLabel,
  view,
}: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  const [ingControllerFormValues, setIngControllerFormValues] = useState(
    ingressControllers || []
  );

  useEffect(() => {
    if (allowNoneIngressClass === undefined) {
      return;
    }

    let newIngFormValues: IngressControllerClassMap[];
    const isCustomTypeExist = ingControllerFormValues.some(
      (ic) => ic.Type === 'custom'
    );
    if (allowNoneIngressClass) {
      newIngFormValues = [...ingControllerFormValues];
      // add the ingress controller type 'custom' with a 'none' ingress class name
      if (!isCustomTypeExist) {
        newIngFormValues.push({
          Name: 'none',
          ClassName: 'none',
          Type: 'custom',
          Availability: true,
          New: false,
          Used: false,
        });
      }
    } else {
      newIngFormValues = ingControllerFormValues.filter(
        (ingController) => ingController.ClassName !== 'none'
      );
    }
    setIngControllerFormValues(newIngFormValues);
    onChangeControllers(newIngFormValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowNoneIngressClass, onChangeControllers]);

  return (
    <div className="-mx-[15px]">
      <Datatable
        settingsManager={tableState}
        dataset={ingControllerFormValues || []}
        columns={columns}
        isLoading={isLoading}
        emptyContentLabel={noIngressControllerLabel}
        title="Ingress Controllers"
        titleIcon={Database}
        getRowId={(row) => `${row.Name}-${row.ClassName}-${row.Type}`}
        renderTableActions={(selectedRows) => renderTableActions(selectedRows)}
        description={renderIngressClassDescription()}
      />
    </div>
  );

  function renderTableActions(selectedRows: IngressControllerClassMap[]) {
    return (
      <div className="flex items-start">
        <ButtonGroup>
          <Button
            disabled={
              selectedRows.filter((row) => row.Availability === true).length ===
              0
            }
            color="dangerlight"
            size="small"
            onClick={() =>
              updateIngressControllers(
                selectedRows,
                ingControllerFormValues || [],
                false
              )
            }
          >
            Disallow selected
          </Button>
          <Button
            disabled={
              selectedRows.filter((row) => row.Availability === false)
                .length === 0
            }
            color="default"
            size="small"
            onClick={() =>
              updateIngressControllers(
                selectedRows,
                ingControllerFormValues || [],
                true
              )
            }
          >
            Allow selected
          </Button>
        </ButtonGroup>
      </div>
    );
  }

  function renderIngressClassDescription() {
    return (
      <div className="text-muted flex w-full flex-col !text-xs">
        <div className="mt-1">{description}</div>
        {ingressControllers &&
          ingControllerFormValues &&
          isUnsavedChanges(ingressControllers, ingControllerFormValues) && (
            <span className="text-warning mt-1 flex items-center">
              <Icon icon={AlertTriangle} className="!mr-1" />
              <span className="text-warning">Unsaved changes.</span>
            </span>
          )}
      </div>
    );
  }

  async function updateIngressControllers(
    selectedRows: IngressControllerClassMap[],
    ingControllerFormValues: IngressControllerClassMap[],
    availability: boolean
  ) {
    const updatedIngressControllers = getUpdatedIngressControllers(
      selectedRows,
      ingControllerFormValues || [],
      availability
    );

    if (ingressControllers && ingressControllers.length) {
      const newAllowed = updatedIngressControllers.map(
        (ingController) => ingController.Availability
      );
      if (view === 'namespace') {
        setIngControllerFormValues(updatedIngressControllers);
        onChangeControllers(updatedIngressControllers);
        return;
      }

      const usedControllersToDisallow = ingressControllers.filter(
        (ingController, index) => {
          // if any of the current controllers are allowed, and are used, then become disallowed, then add the controller to a new list
          if (
            ingController.Availability &&
            ingController.Used &&
            !newAllowed[index]
          ) {
            return true;
          }
          return false;
        }
      );

      if (usedControllersToDisallow.length > 0) {
        const confirmed = await confirm({
          title: 'Disallow in-use ingress controllers?',
          modalType: ModalType.Warn,
          message: (
            <div>
              <p>
                There are ingress controllers you want to disallow that are in
                use:
              </p>
              <ul className="ml-6">
                {usedControllersToDisallow.map((controller) => (
                  <li key={controller.ClassName}>{controller.ClassName}</li>
                ))}
              </ul>
              <p>
                No new ingress rules can be created for the disallowed
                controllers.
              </p>
            </div>
          ),
          confirmButton: buildConfirmButton('Disallow', 'warning'),
        });

        if (!confirmed) {
          return;
        }
      }
      setIngControllerFormValues(updatedIngressControllers);
      onChangeControllers(updatedIngressControllers);
    }
  }
}

function isUnsavedChanges(
  oldIngressControllers: IngressControllerClassMap[],
  newIngressControllers: IngressControllerClassMap[]
) {
  if (oldIngressControllers.length !== newIngressControllers.length) {
    return true;
  }
  for (let i = 0; i < newIngressControllers.length; i += 1) {
    if (
      oldIngressControllers[i]?.Availability !==
      newIngressControllers[i]?.Availability
    ) {
      return true;
    }
  }
  return false;
}

function getUpdatedIngressControllers(
  selectedRows: IngressControllerClassMap[],
  allRows: IngressControllerClassMap[],
  allow: boolean
) {
  const selectedRowClassNames = selectedRows.map((row) => row.ClassName);
  const updatedIngressControllers = allRows?.map((row) => {
    if (selectedRowClassNames.includes(row.ClassName)) {
      return { ...row, Availability: allow };
    }
    return row;
  });
  return updatedIngressControllers;
}
