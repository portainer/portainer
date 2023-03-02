import { truncateLeftRight } from '@/portainer/filters/filters';

import { CopyButton } from '@@/buttons';
import { FormControl } from '@@/form-components/FormControl';

export function WebhookSettings({
  value,
  baseUrl,
  docsLink,
}: {
  docsLink?: string;
  value: string;
  baseUrl: string;
}) {
  const url = `${baseUrl}/${value}`;

  return (
    <FormControl
      label="Webhook"
      tooltip={
        !!docsLink && (
          <>
            See{' '}
            <a href={docsLink} target="_blank" rel="noreferrer">
              Portainer documentation on webhook usage
            </a>
            .
          </>
        )
      }
    >
      <div className="flex items-center gap-2">
        <span className="text-muted">{truncateLeftRight(url)}</span>
        <CopyButton copyText={url} color="light">
          Copy link
        </CopyButton>
      </div>
    </FormControl>
  );
}
