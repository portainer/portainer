import { columnHelper } from './helper';

export const subjectName = columnHelper.accessor(
  (row) => row.subjects?.map((sub) => sub.name).join(' '),
  {
    header: 'Subject Name',
    id: 'subjectName',
    cell: ({ row }) =>
      row.original.subjects?.map((sub, index) => (
        <div key={index}>{sub.name}</div>
      )) || '-',
  }
);
