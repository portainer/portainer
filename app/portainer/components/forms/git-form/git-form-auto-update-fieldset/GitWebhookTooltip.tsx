import { HelpCircle } from 'lucide-react';

import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

export function GitWebhookTooltip() {
  return (
    <TooltipWithChildren
      message={
        <div>
          See{' '}
          <a
            href="https://docs.portainer.io/user/kubernetes/applications/manifest#automatic-updates"
            target="_blank"
            rel="noreferrer"
          >
            Portainer documentation on webhook usage
          </a>
          .
        </div>
      }
      position="bottom"
    >
      {/* override default height to match por-tooltip icon size */}
      <HelpCircle className="lucide ml-1 !h-4 !w-auto" aria-hidden="true" />
    </TooltipWithChildren>
  );
}
