import { useEffect, useState } from 'react';

import { confirmWarn } from '@/portainer/services/modal.service/confirm';

import { Datatable } from '@@/datatables';
import { Button, ButtonGroup } from '@@/buttons';
import { Icon } from '@@/Icon';

import { IngressControllerClassMap } from '../types';

import { useColumns } from './columns';
import { createStore } from './datatable-store';

const useStore = createStore('ingressClasses');

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
  const [ingControllerFormValues, setIngControllerFormValues] = useState(
    ingressControllers || []
  );
  const settings = useStore();
  const columns = useColumns();

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
        dataset={ingControllerFormValues || []}
        storageKey="ingressClasses"
        columns={columns}
        settingsStore={settings}
        isLoading={isLoading}
        emptyContentLabel={noIngressControllerLabel}
        titleOptions={{
          icon: 'database',
          title: 'Ingress controllers',
          featherIcon: true,
        }}
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
      <div className="flex flex-col !text-xs text-muted w-full">
        <div className="mt-1">{description}</div>
        {ingressControllers &&
          ingControllerFormValues &&
          isUnsavedChanges(ingressControllers, ingControllerFormValues) && (
            <span className="flex items-center text-warning mt-1">
              <Icon icon="alert-triangle" feather className="!mr-1" />
              <span className="text-warning">Unsaved changes.</span>
            </span>
          )}
      </div>
    );
  }

  function updateIngressControllers(
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
        const usedControllerHtmlListItems = usedControllersToDisallow.map(
          (controller) => `<li>${controller.ClassName}</li>`
        );
        const usedControllerHtmlList = `<ul class="ml-6">${usedControllerHtmlListItems.join(
          ''
        )}</ul>`;
        confirmWarn({
          title: 'Disallow in-use ingress controllers?',
          message: `
            <div>
              <p>There are ingress controllers you want to disallow that are in use:</p>
              ${usedControllerHtmlList}
              <p>No new ingress rules can be created for the disallowed controllers.</p>
            </div>`,
          buttons: {
            cancel: {
              label: 'Cancel',
              className: 'btn-default',
            },
            confirm: {
              label: 'Disallow',
              className: 'btn-warning',
            },
          },
          callback: (confirmed) => {
            if (confirmed) {
              setIngControllerFormValues(updatedIngressControllers);
              onChangeControllers(updatedIngressControllers);
            }
          },
        });
        return;
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
