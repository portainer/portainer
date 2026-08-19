import { useUIState } from '@/react/hooks/useUIState';

export function useInfoPanelState(panelId: string) {
  const uiStateStore = useUIState();

  const isVisible = !uiStateStore.dismissedInfoPanels[panelId];

  return {
    isVisible,
    dismiss,
  };

  function dismiss() {
    uiStateStore.dismissInfoPanel(panelId);
  }
}
