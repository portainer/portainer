import { Fragment } from 'react';

import { Link } from '@@/Link';

import './Breadcrumbs.css';

export interface Crumb {
  label: string;
  link?: string;
  linkParams?: Record<string, unknown>;
}
interface Props {
  breadcrumbs: (Crumb | string)[] | string;
}

export function Breadcrumbs({ breadcrumbs }: Props) {
  const breadcrumbsArray = Array.isArray(breadcrumbs)
    ? breadcrumbs
    : [breadcrumbs];

  return (
    <div className="breadcrumb-links">
      {breadcrumbsArray.map((crumb, index) => (
        <Fragment key={index}>
          {renderCrumb(crumb)}
          {index !== breadcrumbsArray.length - 1 ? ' > ' : ''}
        </Fragment>
      ))}
    </div>
  );
}

function renderCrumb(crumb: Crumb | string) {
  if (!crumb) {
    return '';
  }

  if (typeof crumb === 'string') {
    return crumb;
  }

  if (crumb.link) {
    return (
      <Link to={crumb.link} params={crumb.linkParams}>
        {crumb.label}
      </Link>
    );
  }

  return crumb.label;
}
