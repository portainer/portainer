import {
  SettableQuickActionsTableSettings,
  QuickAction,
} from '@/react/docker/containers/ListView/ContainersDatatable/types';

import { Checkbox } from '@@/form-components/Checkbox';

import { useTableSettings } from './useTableSettings';

export interface Action {
  id: QuickAction;
  label: string;
}

interface Props {
  actions: Action[];
}

export function QuickActionsSettings({ actions }: Props) {
  const settings =
    useTableSettings<SettableQuickActionsTableSettings<QuickAction>>();

  return (
    <>
      {actions.map(({ id, label }) => (
        <Checkbox
          key={id}
          label={label}
          id={`quick-actions-${id}`}
          checked={!settings.hiddenQuickActions.includes(id)}
          onChange={(e) => toggleAction(id, e.target.checked)}
        />
      ))}
    </>
  );

  function toggleAction(key: QuickAction, visible: boolean) {
    if (!visible) {
      settings.setHiddenQuickActions([...settings.hiddenQuickActions, key]);
    } else {
      settings.setHiddenQuickActions(
        settings.hiddenQuickActions.filter((action) => action !== key)
      );
    }
  }
}

export function buildAction(id: QuickAction, label: string): Action {
  return { id, label };
}
