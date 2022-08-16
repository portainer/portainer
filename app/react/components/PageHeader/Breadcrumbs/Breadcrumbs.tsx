import { Fragment } from 'react';

import { Link } from '@@/Link';

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
    <div className="text-xs font-medium text-gray-7 th-dark:text-gray-5 th-highcontrast:text-white space-x-2">
      {breadcrumbsArray.map((crumb, index) => (
        <Fragment key={index}>
          <span>{renderCrumb(crumb)}</span>
          {index !== breadcrumbsArray.length - 1 && <span>&gt;</span>}
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
      <Link
        to={crumb.link}
        params={crumb.linkParams}
        className="text-blue-9 hover:underline hover:text-blue-11 th-dark:text-blue-7 th-dark:hover:text-blue-9 th-highcontrast:text-blue-5"
      >
        {crumb.label}
      </Link>
    );
  }

  return crumb.label;
}
