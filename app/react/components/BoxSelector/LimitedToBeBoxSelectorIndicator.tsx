interface Props {
  url?: string;
}

export function LimitedToBeBoxSelectorIndicator({ url }: Props) {
  return (
    <div className="absolute left-0 top-0 w-full">
      <div className="mx-auto flex max-w-fit items-center gap-1 rounded-b-lg bg-transparent px-3 py-1 text-sm border-solid border border-gray-6 border-t-0">
        <a className="text-gray-6" href={url} target="_blank" rel="noreferrer">
          BE Feature
        </a>
      </div>
    </div>
  );
}
