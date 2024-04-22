import { ExternalLink } from 'lucide-react';

import { Icon } from '@@/Icon';

type Props = {
  hostURL?: string;
  hostPort?: string | number;
  containerPort?: string | number;
};

export function PublishedPortLink({ hostURL, hostPort, containerPort }: Props) {
  return (
    <a
      className="image-tag"
      href={generateContainerURL(hostURL, hostPort, containerPort)}
      target="_blank"
      rel="noreferrer"
    >
      <Icon icon={ExternalLink} />
      {hostPort}:{containerPort}
    </a>
  );
}

function generateContainerURL(
  hostURL?: string,
  hostPort?: string | number,
  containerPort?: string | number
) {
  const url = stripTrailingSlash(hostURL?.toLowerCase());

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (String(containerPort).endsWith('443')) {
      return `https://${url}:${hostPort}`;
    }

    return `http://${url}:${hostPort}`;
  }

  return `${url}:${hostPort}`;
}

function stripTrailingSlash(url?: string) {
  if (!url) {
    return '';
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
