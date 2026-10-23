import { Fragment } from 'react';
import { Home, ChevronRight } from 'lucide-react';

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
    <div className="flex items-center gap-2 text-sm font-medium text-gray-8 th-highcontrast:text-white th-dark:text-gray-5">
      <Link
        to="portainer.home"
        className="p-1.5 text-gray-8 hover:text-blue-11 th-highcontrast:text-white th-dark:text-gray-5 th-dark:hover:text-blue-9"
        data-cy="breadcrumb-home"
      >
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-3 w-3" aria-hidden="true" />
      {breadcrumbsArray.map((crumb, index) => (
        <Fragment key={index}>
          <span>{renderCrumb(crumb)}</span>
          {index !== breadcrumbsArray.length - 1 && (
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          )}
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
        className="text-blue-9 hover:text-blue-11 hover:underline th-highcontrast:text-blue-5 th-dark:text-blue-7 th-dark:hover:text-blue-9"
        data-cy={`breadcrumb-${crumb.label}`}
      >
        {crumb.label}
      </Link>
    );
  }

  return crumb.label;
}
