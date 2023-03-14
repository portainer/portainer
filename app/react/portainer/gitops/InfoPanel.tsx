import clsx from 'clsx';

interface Props {
  url: string;
  configFilePath: string;
  additionalFiles?: string[];
  className: string;
  type: string;
}

export function InfoPanel({
  url,
  configFilePath,
  additionalFiles = [],
  className,
  type,
}: Props) {
  return (
    <div className={clsx('form-group', className)}>
      <div className="col-sm-12">
        <p>
          This {type} was deployed from the git repository <code>{url}</code>.
        </p>
        <p>
          Update
          <code>{[configFilePath, ...additionalFiles].join(', ')}</code>
          in git and pull from here to update the {type}.
        </p>
      </div>
    </div>
  );
}
