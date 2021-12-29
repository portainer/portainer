import { Fragment } from 'react';

import { Link } from '@/portainer/components/Link';

import './Breadcrumbs.css';

export interface Crumb {
  label: string;
  link?: string;
  linkParams?: Record<string, unknown>;
}
interface Props {
  breadcrumbs: Crumb[];
}

export function Breadcrumbs({ breadcrumbs }: Props) {
  return (
    <div className="breadcrumb-links">
      {breadcrumbs.map((crumb, index) => (
        <Fragment key={index}>
          {renderCrumb(crumb)}
          {index !== breadcrumbs.length - 1 ? ' > ' : ''}
        </Fragment>
      ))}
    </div>
  );
}

function renderCrumb(crumb: Crumb) {
  if (crumb.link) {
    return (
      <Link to={crumb.link} params={crumb.linkParams}>
        {crumb.label}
      </Link>
    );
  }

  return crumb.label;
}
