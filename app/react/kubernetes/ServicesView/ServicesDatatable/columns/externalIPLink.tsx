import { ExternalLink } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  to: string;
  text: string;
}

export function ExternalIPLink({ to, text }: Props) {
  return (
    <div>
      <a href={to} target="_blank" rel="noreferrer">
        <Icon icon={ExternalLink} />
        &nbsp;
        <span>{text}</span>
      </a>
    </div>
  );
}
