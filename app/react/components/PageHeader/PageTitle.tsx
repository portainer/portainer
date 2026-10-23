import { PropsWithChildren } from 'react';

export function PageTitle({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <div className="mx-4 mb-2 flex items-center gap-2">
      <h1
        className="m-0 text-lg font-medium text-gray-11 th-highcontrast:text-white th-dark:text-white"
        data-cy="page-title"
      >
        {title}
      </h1>
      {children}
    </div>
  );
}
