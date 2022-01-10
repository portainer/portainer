import { Checkbox } from '@/portainer/components/form-components/Checkbox';

import { useTableSettings } from './useTableSettings';

export interface Action {
  id: string;
  label: string;
}

interface Props {
  actions: Action[];
}

export interface QuickActionsSettingsType {
  hiddenQuickActions: string[];
}

export function QuickActionsSettings({ actions }: Props) {
  const { settings, setTableSettings } = useTableSettings<
    QuickActionsSettingsType
  >();

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

  function toggleAction(key: string, value: boolean) {
    setTableSettings(({ hiddenQuickActions = [], ...settings }) => ({
      ...settings,
      hiddenQuickActions: value
        ? hiddenQuickActions.filter((id) => id !== key)
        : [...hiddenQuickActions, key],
    }));
  }
}

export function buildAction(id: string, label: string): Action {
  return { id, label };
}
