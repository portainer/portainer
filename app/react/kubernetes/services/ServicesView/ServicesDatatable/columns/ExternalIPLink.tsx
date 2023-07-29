import { ExternalLink } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  to: string;
  text: string;
}

export function ExternalIPLink({ to, text }: Props) {
  return (
    <a
      href={to}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1"
    >
      <Icon icon={ExternalLink} />
      <span>{text}</span>
    </a>
  );
}
