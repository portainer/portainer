import Route from '@/assets/ico/route.svg?c';

import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { Datatable } from '@@/datatables';
import { Button, ButtonGroup } from '@@/buttons';
import { createPersistedStore } from '@@/datatables/types';
import { buildConfirmButton } from '@@/modals/utils';
import { useTableState } from '@@/datatables/useTableState';
import { TextTip } from '@@/Tip/TextTip';

import { IngressControllerClassMap } from '../types';

import { columns } from './columns';

const storageKey = 'ingressClasses';
const settingsStore = createPersistedStore(storageKey, 'name');

interface Props {
  onChange: (controllerClassMap: IngressControllerClassMap[]) => void; // angular function to save the ingress class list
  description: string;
  values: IngressControllerClassMap[] | undefined;
  initialValues: IngressControllerClassMap[] | undefined;
  isLoading: boolean;
  noIngressControllerLabel: string;
  view: 'namespace' | 'cluster';
}

export function IngressClassDatatable({
  onChange,
  description,
  initialValues,
  values,
  isLoading,
  noIngressControllerLabel,
  view,
}: Props) {
  const tableState = useTableState(settingsStore, storageKey);

  return (
    <div className="-mx-[15px]">
      <Datatable
        settingsManager={tableState}
        dataset={values || []}
        columns={columns}
        isLoading={isLoading}
        title="Ingress Controllers"
        titleIcon={Route}
        getRowId={(row) => `${row.Name}-${row.ClassName}-${row.Type}`}
        renderTableActions={(selectedRows) => renderTableActions(selectedRows)}
        description={renderIngressClassDescription()}
        data-cy="ingress-class-datatable"
      />
    </div>
  );

  function renderTableActions(selectedRows: IngressControllerClassMap[]) {
    return (
      <div className="flex items-start">
        <ButtonGroup>
          <Button
            data-cy="disallow-ingress-controllers-button"
            disabled={
              selectedRows.filter((row) => row.Availability === true).length ===
              0
            }
            color="dangerlight"
            size="small"
            onClick={() =>
              updateIngressControllers(selectedRows, values || [], false)
            }
          >
            Disallow selected
          </Button>
          <Button
            data-cy="allow-ingress-controllers-button"
            disabled={
              selectedRows.filter((row) => row.Availability === false)
                .length === 0
            }
            color="default"
            size="small"
            onClick={() =>
              updateIngressControllers(selectedRows, values || [], true)
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
      <div className="flex flex-col gap-3">
        {!isLoading && values && values.length === 0 && (
          <TextTip>{noIngressControllerLabel}</TextTip>
        )}
        <div className="text-muted flex w-full flex-col !text-xs">
          <div className="mt-1">{description}</div>
          {initialValues &&
            values &&
            isUnsavedChanges(initialValues, values) && (
              <TextTip>Unsaved changes.</TextTip>
            )}
        </div>
      </div>
    );
  }

  async function updateIngressControllers(
    selectedRows: IngressControllerClassMap[],
    values: IngressControllerClassMap[],
    availability: boolean
  ) {
    const updatedIngressControllers = getUpdatedIngressControllers(
      selectedRows,
      values || [],
      availability
    );

    if (values && values.length) {
      const newAllowed = updatedIngressControllers.map(
        (ingController) => ingController.Availability
      );
      if (view === 'namespace') {
        onChange(updatedIngressControllers);
        return;
      }

      const usedControllersToDisallow = values.filter(
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
      onChange(updatedIngressControllers);
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
