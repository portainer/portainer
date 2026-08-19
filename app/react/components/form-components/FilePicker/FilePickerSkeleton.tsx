export function FilePickerSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-solid border-gray-4 bg-white th-highcontrast:border-white th-highcontrast:bg-black th-dark:border-gray-7 th-dark:bg-gray-iron-10">
      <div className="flex flex-col gap-2 border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <div className="h-3 w-3/4 rounded bg-gray-3 th-dark:bg-gray-8" />
        <div className="flex gap-1">
          <div className="h-7 w-14 rounded bg-gray-3 th-dark:bg-gray-8" />
          <div className="h-7 w-12 rounded bg-gray-3 th-dark:bg-gray-8" />
          <div className="h-7 w-16 rounded bg-gray-3 th-dark:bg-gray-8" />
        </div>
      </div>

      <div className="flex items-center border-b border-l-0 border-r-0 border-t-0 border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <div className="h-8 w-full rounded bg-gray-3 th-dark:bg-gray-8" />
      </div>

      <div className="flex h-80 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto px-1 py-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex h-8 items-center gap-2 px-3"
              style={{ paddingLeft: `${(i % 3) * 12 + 12}px` }}
            >
              <div className="h-4 w-4 shrink-0 rounded bg-gray-3 th-dark:bg-gray-8" />
              <div
                className="h-3 rounded bg-gray-3 th-dark:bg-gray-8"
                style={{ width: `${40 + ((i * 37) % 80)}px` }}
              />
            </div>
          ))}
        </div>

        <div className="flex w-80 shrink-0 flex-col border-b-0 border-l border-r-0 border-t-0 border-solid border-gray-4 th-highcontrast:border-white th-dark:border-gray-7">
          <div className="border-b border-solid border-gray-4 px-3 py-2 th-dark:border-gray-7">
            <div className="h-3 w-20 rounded bg-gray-3 th-dark:bg-gray-8" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="h-3 w-32 rounded bg-gray-2 th-dark:bg-gray-9" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b-0 border-l-0 border-r-0 border-t border-solid border-gray-4 px-3 py-2 th-highcontrast:border-white th-dark:border-gray-7">
        <div className="h-3 w-16 rounded bg-gray-3 th-dark:bg-gray-8" />
        <div className="h-7 w-16 rounded bg-gray-3 th-dark:bg-gray-8" />
      </div>
    </div>
  );
}
