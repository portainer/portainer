import { BROWSER_OS_PLATFORM } from '@/react/constants';

import { Tooltip } from '@@/Tip/Tooltip';

const otherEditorConfig = {
  tooltip: (
    <>
      <div>Ctrl+F - Start searching</div>
      <div>Ctrl+G - Find next</div>
      <div>Ctrl+Shift+G - Find previous</div>
      <div>Ctrl+Shift+F - Replace</div>
      <div>Ctrl+Shift+R - Replace all</div>
      <div>Alt+G - Jump to line</div>
      <div>Persistent search:</div>
      <div className="ml-5">Enter - Find next</div>
      <div className="ml-5">Shift+Enter - Find previous</div>
    </>
  ),
  searchCmdLabel: 'Ctrl+F for search',
} as const;

export const editorConfig = {
  mac: {
    tooltip: (
      <>
        <div>Cmd+F - Start searching</div>
        <div>Cmd+G - Find next</div>
        <div>Cmd+Shift+G - Find previous</div>
        <div>Cmd+Option+F - Replace</div>
        <div>Cmd+Option+R - Replace all</div>
        <div>Option+G - Jump to line</div>
        <div>Persistent search:</div>
        <div className="ml-5">Enter - Find next</div>
        <div className="ml-5">Shift+Enter - Find previous</div>
      </>
    ),
    searchCmdLabel: 'Cmd+F for search',
  },

  lin: otherEditorConfig,
  win: otherEditorConfig,
} as const;

export function ShortcutsTooltip() {
  return (
    <div className="text-muted small vertical-center ml-auto">
      {editorConfig[BROWSER_OS_PLATFORM].searchCmdLabel}

      <Tooltip message={editorConfig[BROWSER_OS_PLATFORM].tooltip} />
    </div>
  );
}
