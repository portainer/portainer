import { ReactNode } from 'react';

import { useDocsUrl } from '@@/PageHeader/ContextHelp';

type HelpLinkProps = {
  docLink: string;
  target?: string;
  children?: ReactNode;
};

export function HelpLink({
  docLink,
  target = '_blank',
  children,
}: HelpLinkProps) {
  const docsUrl = useDocsUrl(docLink);

  return (
    <a href={docsUrl} target={target} rel="noopener noreferrer">
      {children}
    </a>
  );
}
