/* eslint no-param-reassign: ["error", { "props": false }] */
import { ChangeEvent, useCallback, useMemo } from 'react';
import {
  actions,
  makePropGetter,
  ensurePluginOrder,
  useGetLatest,
  useMountedLayoutEffect,
  Hooks,
  TableInstance,
  TableState,
  ActionType,
  ReducerTableState,
  IdType,
  Row,
  PropGetter,
  TableToggleRowsSelectedProps,
  TableToggleAllRowsSelectedProps,
} from 'react-table';

type DefaultType = Record<string, unknown>;

interface UseRowSelectTableInstance<D extends DefaultType = DefaultType>
  extends TableInstance<D> {
  isAllRowSelected: boolean;
  selectSubRows: boolean;
  getSubRows(row: Row<D>): Row<D>[];
  isRowSelectable?(row: Row<D>): boolean;
}

const pluginName = 'useRowSelect';

// Actions
actions.resetSelectedRows = 'resetSelectedRows';
actions.toggleAllRowsSelected = 'toggleAllRowsSelected';
actions.toggleRowSelected = 'toggleRowSelected';
actions.toggleAllPageRowsSelected = 'toggleAllPageRowsSelected';

export function useRowSelect<D extends DefaultType>(hooks: Hooks<D>) {
  hooks.getToggleRowSelectedProps = [
    defaultGetToggleRowSelectedProps as PropGetter<
      D,
      TableToggleRowsSelectedProps
    >,
  ];
  hooks.getToggleAllRowsSelectedProps = [
    defaultGetToggleAllRowsSelectedProps as PropGetter<
      D,
      TableToggleAllRowsSelectedProps
    >,
  ];
  hooks.getToggleAllPageRowsSelectedProps = [
    defaultGetToggleAllPageRowsSelectedProps as PropGetter<
      D,
      TableToggleAllRowsSelectedProps
    >,
  ];
  hooks.stateReducers.push(
    reducer as (
      newState: TableState<D>,
      action: ActionType,
      previousState?: TableState<D>,
      instance?: TableInstance<D>
    ) => ReducerTableState<D> | undefined
  );
  hooks.useInstance.push(useInstance as (instance: TableInstance<D>) => void);
  hooks.prepareRow.push(prepareRow);
}

useRowSelect.pluginName = pluginName;

function defaultGetToggleRowSelectedProps<D extends DefaultType>(
  props: D,
  { instance, row }: { instance: UseRowSelectTableInstance<D>; row: Row<D> }
) {
  const {
    manualRowSelectedKey = 'isSelected',
    isRowSelectable = defaultIsRowSelectable,
  } = instance;
  let checked = false;

  if (row.original && row.original[manualRowSelectedKey]) {
    checked = true;
  } else {
    checked = row.isSelected;
  }

  return [
    props,
    {
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        row.toggleRowSelected(e.target.checked);
      },
      style: {
        cursor: 'pointer',
      },
      checked,
      title: 'Toggle Row Selected',
      indeterminate: row.isSomeSelected,
      disabled: !isRowSelectable(row),
    },
  ];
}

function defaultGetToggleAllRowsSelectedProps<D extends DefaultType>(
  props: D,
  { instance }: { instance: UseRowSelectTableInstance<D> }
) {
  return [
    props,
    {
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        instance.toggleAllRowsSelected(e.target.checked);
      },
      style: {
        cursor: 'pointer',
      },
      checked: instance.isAllRowsSelected,
      title: 'Toggle All Rows Selected',
      indeterminate: Boolean(
        !instance.isAllRowsSelected &&
          Object.keys(instance.state.selectedRowIds).length
      ),
    },
  ];
}

function defaultGetToggleAllPageRowsSelectedProps<D extends DefaultType>(
  props: D,
  { instance }: { instance: UseRowSelectTableInstance<D> }
) {
  return [
    props,
    {
      onChange(e: ChangeEvent<HTMLInputElement>) {
        instance.toggleAllPageRowsSelected(e.target.checked);
      },
      style: {
        cursor: 'pointer',
      },
      checked: instance.isAllPageRowsSelected,
      title: 'Toggle All Current Page Rows Selected',
      indeterminate: Boolean(
        !instance.isAllPageRowsSelected &&
          instance.page.some(({ id }) => instance.state.selectedRowIds[id])
      ),
    },
  ];
}

function reducer<D extends Record<string, unknown>>(
  state: TableState<D>,
  action: ActionType,
  _previousState?: TableState<D>,
  instance?: UseRowSelectTableInstance<D>
) {
  if (action.type === actions.init) {
    return {
      ...state,
      selectedRowIds: <Record<IdType<D>, boolean>>{},
    };
  }

  if (action.type === actions.resetSelectedRows) {
    return {
      ...state,
      selectedRowIds: instance?.initialState.selectedRowIds || {},
    };
  }

  if (action.type === actions.toggleAllRowsSelected) {
    const { value: setSelected } = action;

    if (!instance) {
      return state;
    }

    const {
      isAllRowsSelected,
      rowsById,
      nonGroupedRowsById = rowsById,
      isRowSelectable = defaultIsRowSelectable,
    } = instance;

    const selectAll =
      typeof setSelected !== 'undefined' ? setSelected : !isAllRowsSelected;

    // Only remove/add the rows that are visible on the screen
    //  Leave all the other rows that are selected alone.
    const selectedRowIds = { ...state.selectedRowIds };

    Object.keys(nonGroupedRowsById).forEach((rowId: IdType<D>) => {
      if (selectAll) {
        const row = rowsById[rowId];
        if (isRowSelectable(row)) {
          selectedRowIds[rowId] = true;
        }
      } else {
        delete selectedRowIds[rowId];
      }
    });

    return {
      ...state,
      selectedRowIds,
    };
  }

  if (action.type === actions.toggleRowSelected) {
    if (!instance) {
      return state;
    }

    const { id, value: setSelected } = action;
    const {
      rowsById,
      selectSubRows = true,
      getSubRows,
      isRowSelectable = defaultIsRowSelectable,
    } = instance;

    const isSelected = state.selectedRowIds[id];
    const shouldExist =
      typeof setSelected !== 'undefined' ? setSelected : !isSelected;

    if (isSelected === shouldExist) {
      return state;
    }

    const newSelectedRowIds = { ...state.selectedRowIds };

    // eslint-disable-next-line no-inner-declarations
    function handleRowById(id: IdType<D>) {
      const row = rowsById[id];

      if (!isRowSelectable(row)) {
        return;
      }

      if (!row.isGrouped) {
        if (shouldExist) {
          newSelectedRowIds[id] = true;
        } else {
          delete newSelectedRowIds[id];
        }
      }

      if (selectSubRows && getSubRows(row)) {
        getSubRows(row).forEach((row) => handleRowById(row.id));
      }
    }

    handleRowById(id);

    return {
      ...state,
      selectedRowIds: newSelectedRowIds,
    };
  }

  if (action.type === actions.toggleAllPageRowsSelected) {
    if (!instance) {
      return state;
    }

    const { value: setSelected } = action;
    const {
      page,
      rowsById,
      selectSubRows = true,
      isAllPageRowsSelected,
      getSubRows,
    } = instance;

    const selectAll =
      typeof setSelected !== 'undefined' ? setSelected : !isAllPageRowsSelected;

    const newSelectedRowIds = { ...state.selectedRowIds };

    // eslint-disable-next-line no-inner-declarations
    function handleRowById(id: IdType<D>) {
      const row = rowsById[id];

      if (!row.isGrouped) {
        if (selectAll) {
          newSelectedRowIds[id] = true;
        } else {
          delete newSelectedRowIds[id];
        }
      }

      if (selectSubRows && getSubRows(row)) {
        getSubRows(row).forEach((row) => handleRowById(row.id));
      }
    }

    page.forEach((row) => handleRowById(row.id));

    return {
      ...state,
      selectedRowIds: newSelectedRowIds,
    };
  }
  return state;
}

function useInstance<D extends Record<string, unknown>>(
  instance: UseRowSelectTableInstance<D>
) {
  const {
    data,
    rows,
    getHooks,
    plugins,
    rowsById,
    nonGroupedRowsById = rowsById,
    autoResetSelectedRows = true,
    state: { selectedRowIds },
    selectSubRows = true,
    dispatch,
    page,
    getSubRows,
    isRowSelectable = defaultIsRowSelectable,
  } = instance;

  ensurePluginOrder(
    plugins,
    ['useFilters', 'useGroupBy', 'useSortBy', 'useExpanded', 'usePagination'],
    'useRowSelect'
  );

  const selectedFlatRows = useMemo(() => {
    const selectedFlatRows = <Array<Row<D>>>[];

    rows.forEach((row) => {
      const isSelected = selectSubRows
        ? getRowIsSelected(row, selectedRowIds, getSubRows)
        : !!selectedRowIds[row.id];
      row.isSelected = !!isSelected;
      row.isSomeSelected = isSelected === null;

      if (isSelected) {
        selectedFlatRows.push(row);
      }
    });

    return selectedFlatRows;
  }, [rows, selectSubRows, selectedRowIds, getSubRows]);

  let isAllRowsSelected = Boolean(
    Object.keys(nonGroupedRowsById).length && Object.keys(selectedRowIds).length
  );

  let isAllPageRowsSelected = isAllRowsSelected;

  if (isAllRowsSelected) {
    if (
      Object.keys(nonGroupedRowsById).some((id) => {
        const row = rowsById[id];

        return !selectedRowIds[id] && isRowSelectable(row);
      })
    ) {
      isAllRowsSelected = false;
    }
  }

  if (!isAllRowsSelected) {
    if (
      page &&
      page.length &&
      page.some(({ id }) => {
        const row = rowsById[id];

        return !selectedRowIds[id] && isRowSelectable(row);
      })
    ) {
      isAllPageRowsSelected = false;
    }
  }

  const getAutoResetSelectedRows = useGetLatest(autoResetSelectedRows);

  useMountedLayoutEffect(() => {
    if (getAutoResetSelectedRows()) {
      dispatch({ type: actions.resetSelectedRows });
    }
  }, [dispatch, data]);

  const toggleAllRowsSelected = useCallback(
    (value) => dispatch({ type: actions.toggleAllRowsSelected, value }),
    [dispatch]
  );

  const toggleAllPageRowsSelected = useCallback(
    (value) => dispatch({ type: actions.toggleAllPageRowsSelected, value }),
    [dispatch]
  );

  const toggleRowSelected = useCallback(
    (id, value) => dispatch({ type: actions.toggleRowSelected, id, value }),
    [dispatch]
  );

  const getInstance = useGetLatest(instance);

  const getToggleAllRowsSelectedProps = makePropGetter(
    getHooks().getToggleAllRowsSelectedProps,
    { instance: getInstance() }
  );

  const getToggleAllPageRowsSelectedProps = makePropGetter(
    getHooks().getToggleAllPageRowsSelectedProps,
    { instance: getInstance() }
  );

  Object.assign(instance, {
    selectedFlatRows,
    isAllRowsSelected,
    isAllPageRowsSelected,
    toggleRowSelected,
    toggleAllRowsSelected,
    getToggleAllRowsSelectedProps,
    getToggleAllPageRowsSelectedProps,
    toggleAllPageRowsSelected,
  });
}

function prepareRow<D extends Record<string, unknown>>(
  row: Row<D>,
  { instance }: { instance: TableInstance<D> }
) {
  row.toggleRowSelected = (set) => instance.toggleRowSelected(row.id, set);

  row.getToggleRowSelectedProps = makePropGetter(
    instance.getHooks().getToggleRowSelectedProps,
    { instance, row }
  );
}

function getRowIsSelected<D extends Record<string, unknown>>(
  row: Row<D>,
  selectedRowIds: Record<IdType<D>, boolean>,
  getSubRows: (row: Row<D>) => Array<Row<D>>
) {
  if (selectedRowIds[row.id]) {
    return true;
  }

  const subRows = getSubRows(row);

  if (subRows && subRows.length) {
    let allChildrenSelected = true;
    let someSelected = false;

    subRows.forEach((subRow) => {
      // Bail out early if we know both of these
      if (someSelected && !allChildrenSelected) {
        return;
      }

      if (getRowIsSelected(subRow, selectedRowIds, getSubRows)) {
        someSelected = true;
      } else {
        allChildrenSelected = false;
      }
    });

    if (allChildrenSelected) {
      return true;
    }

    return someSelected ? null : false;
  }

  return false;
}

function defaultIsRowSelectable<D extends DefaultType>(row: Row<D>) {
  return !row.original.disabled;
}
