import { useDocsUrl } from '../PageHeader/ContextHelp/ContextHelp';

type HelpLinkProps = {
  docLink?: string;
  target?: string;
  children?: React.ReactNode;
};

export function HelpLink({
  docLink,
  target = '_blank',
  children,
}: HelpLinkProps) {
  const docsUrl = useDocsUrl(docLink);

  return (
    <a href={docsUrl} target={target} rel="noreferrer">
      {children}
    </a>
  );
}
