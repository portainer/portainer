import { ExternalLinkIcon } from 'lucide-react';

import { getSchemeFromPort } from '@/react/common/network-utils';

import { Icon } from '@@/Icon';

import { Application } from './types';

export function PublishedPorts({ item }: { item: Application }) {
  const urls = getPublishedUrls(item);

  if (urls.length === 0) {
    return null;
  }

  return (
    <div className="published-url-container">
      <div>
        <div className="text-muted"> Published URL(s) </div>
      </div>
      <div>
        {urls.map((url) => (
          <div key={url}>
            <a
              href={url}
              target="_blank"
              className="publish-url-link vertical-center"
              rel="noreferrer"
            >
              <Icon icon={ExternalLinkIcon} />
              {url}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function getPublishedUrls(item: Application) {
  // Map all ingress rules in published ports to their respective URLs
  const ingressUrls =
    item.PublishedPorts?.flatMap((pp) => pp.IngressRules)
      .filter(({ Host, IP }) => Host || IP)
      .map(({ Host, IP, Path, TLS }) => {
        const scheme =
          TLS &&
          TLS.filter((tls) => tls.hosts && tls.hosts.includes(Host)).length > 0
            ? 'https'
            : 'http';
        return `${scheme}://${Host || IP}${Path}`;
      }) || [];

  // Map all load balancer service ports to ip address
  const loadBalancerURLs =
    (item.LoadBalancerIPAddress &&
      item.PublishedPorts?.map(
        (pp) =>
          `${getSchemeFromPort(pp.Port)}://${item.LoadBalancerIPAddress}:${
            pp.Port
          }`
      )) ||
    [];

  // combine ingress urls
  const publishedUrls = [...ingressUrls, ...loadBalancerURLs];

  // Return the first URL - priority given to ingress urls, then services (load balancers)
  return publishedUrls.length > 0 ? publishedUrls : [];
}
