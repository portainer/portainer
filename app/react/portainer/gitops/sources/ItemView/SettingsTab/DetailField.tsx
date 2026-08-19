export function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-gray-6 th-highcontrast:text-gray-3 th-dark:text-gray-5">
        {label}
      </span>
      <span className="font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
        {children}
      </span>
    </div>
  );
}
