import { ExternalLinkIcon } from 'lucide-react';

import { getSchemeFromPort } from '@/react/common/network-utils';

import { Icon } from '@@/Icon';

import { Application } from './types';

export function PublishedPorts({ item }: { item: Application }) {
  const urlsWithTypes = getPublishedUrls(item);

  if (urlsWithTypes.length === 0) {
    return null;
  }

  return (
    <div className="published-url-container flex">
      <div className="text-muted mr-12">Published URL(s)</div>
      <div className="flex flex-col">
        {urlsWithTypes.map(({ url, type }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            className="publish-url-link vertical-center mb-1"
            rel="noreferrer"
          >
            <Icon icon={ExternalLinkIcon} />
            {type && (
              <span className="text-muted inline-block w-24">{type}</span>
            )}
            <span>{url}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function getClusterIPUrls(services?: Application['Services']) {
  return (
    services?.flatMap(
      (service) =>
        (service.spec?.type === 'ClusterIP' &&
          service.spec?.ports?.map((port) => ({
            url: `${getSchemeFromPort(port.port)}://${
              service?.spec?.clusterIP
            }:${port.port}`,
            type: 'ClusterIP',
          }))) ||
        []
    ) || []
  );
}

function getNodePortUrls(services?: Application['Services']) {
  return (
    services?.flatMap(
      (service) =>
        (service.spec?.type === 'NodePort' &&
          service.spec?.ports?.map((port) => ({
            url: `${getSchemeFromPort(port.port)}://${
              window.location.hostname
            }:${port.nodePort}`,
            type: 'NodePort',
          }))) ||
        []
    ) || []
  );
}

export function getPublishedUrls(item: Application) {
  // Get URLs from clusterIP and nodePort services
  const clusterIPs = getClusterIPUrls(item.Services);
  const nodePortUrls = getNodePortUrls(item.Services);

  // combine all urls
  const publishedUrls = [...clusterIPs, ...nodePortUrls];

  return publishedUrls.length > 0 ? publishedUrls : [];
}
