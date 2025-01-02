import { columnHelper } from './helper';

export const subjectKind = columnHelper.accessor(
  (row) => row.subjects?.map((sub) => sub.kind).join(', '),
  {
    header: 'Subject Kind',
    id: 'subjectKind',
    cell: ({ row }) =>
      row.original.subjects?.map((sub, index) => (
        <div key={index}>{sub.kind}</div>
      )) || '-',
  }
);
