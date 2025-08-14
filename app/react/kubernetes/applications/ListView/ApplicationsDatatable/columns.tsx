import { CellContext, Row } from '@tanstack/react-table';
import { useRef } from 'react';

import { isoDate } from '@/portainer/filters/filters';
import { useIsSystemNamespace } from '@/react/kubernetes/namespaces/queries/useIsSystemNamespace';

import { Link } from '@@/Link';
import { SystemBadge } from '@@/Badge/SystemBadge';
import { filterHOC } from '@@/datatables/Filter';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { Application } from './types';
import { helper } from './columns.helper';

export const stackName = helper.accessor('StackName', {
  header: 'Stack',
  cell: ({ getValue }) => getValue() || '-',
});

export const namespace = helper.accessor('ResourcePool', {
  header: 'Namespace',
  cell: NamespaceCell,
});

function NamespaceCell({ row, getValue }: CellContext<Application, string>) {
  const value = getValue();
  const isSystem = useIsSystemNamespace(value);
  return (
    <div className="flex gap-2">
      <Link
        to="kubernetes.resourcePools.resourcePool"
        params={{ id: value }}
        data-cy={`app-namespace-link-${row.original.Name}`}
      >
        {value}
      </Link>
      {isSystem && <SystemBadge className="ml-auto" />}
    </div>
  );
}

export const image = helper.accessor('Image', {
  header: 'Image',
  cell: ({ row: { original: item } }) => (
    <ImageCell image={item.Image} imageCount={item.Containers?.length || 0} />
  ),
});

function ImageCell({
  image,
  imageCount,
}: {
  image: string;
  imageCount: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const isTruncated = isWidthTruncated();

  const imageElement = (
    <div className="inline-block max-w-xs truncate" ref={contentRef}>
      {image}
    </div>
  );

  if (isTruncated) {
    return (
      <TooltipWithChildren message={image}>{imageElement}</TooltipWithChildren>
    );
  }

  return (
    <div>
      {imageElement}
      {imageCount > 1 && <> + {imageCount - 1}</>}
    </div>
  );

  function isWidthTruncated() {
    const el = contentRef.current;
    return el && el.scrollWidth > el.clientWidth;
  }
}

export const appType = helper.accessor('ApplicationType', {
  header: 'Application type',
  meta: {
    filter: filterHOC('Filter by application type'),
  },
  enableColumnFilter: true,
  filterFn: (row: Row<Application>, _: string, filterValue: string[]) =>
    filterValue.length === 0 ||
    (!!row.original.ApplicationType &&
      filterValue.includes(row.original.ApplicationType)),
});

export const published = helper.accessor('Services', {
  header: 'Published',
  cell: ({ row: { original: item } }) =>
    item.Services?.length === 0 ? 'No' : 'Yes',
  enableSorting: false,
});

export const created = helper.accessor('CreationDate', {
  header: 'Created',
  cell({ row: { original: item } }) {
    return (
      <>
        {isoDate(item.CreationDate)}{' '}
        {item.ApplicationOwner ? ` by ${item.ApplicationOwner}` : ''}
      </>
    );
  },
});
