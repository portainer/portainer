import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { sidebarStore } from '@/react/sidebar/sidebarStore';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

export function SidebarToggleButton() {
  const { isOpen, toggle } = sidebarStore();

  return (
    <TooltipWithChildren message={`${isOpen ? 'Collapse' : 'Expand'} sidebar`}>
      <button
        type="button"
        onClick={toggle}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-0 bg-transparent text-sm text-gray-7 transition-colors duration-200 hover:text-blue-11 th-highcontrast:text-white th-dark:text-gray-5 th-dark:hover:text-blue-9"
        aria-label="Toggle Sidebar"
        title="Toggle Sidebar"
      >
        {isOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
      </button>
    </TooltipWithChildren>
  );
}
