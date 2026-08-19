import clsx from 'clsx';
import { ChangeEvent, ComponentProps, createRef } from 'react';
import { CheckIcon, Loader2Icon, UploadIcon, XCircleIcon } from 'lucide-react';

import { AutomationTestingProps } from '@/types';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { Tooltip } from '@@/Tip/Tooltip';

export interface Props extends AutomationTestingProps {
  onChange(value: File): void;
  value?: File | null;
  accept?: string;
  title?: string;
  required?: boolean;
  inputId: string;
  className?: string;
  color?: ComponentProps<typeof Button>['color'];
  name?: string;
  hideFilename?: boolean;
  tooltip?: string;
  state?: 'uploading' | 'success';
  disabled?: boolean;
}

export function FileUploadField({
  onChange,
  value,
  accept,
  title = 'Select a file',
  required = false,
  inputId,
  className,
  color = 'primary',
  name,
  hideFilename,
  tooltip,
  disabled,
  state,
  'data-cy': dataCy,
}: Props) {
  const fileRef = createRef<HTMLInputElement>();

  return (
    <div className="flex items-center gap-2">
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept={accept}
        required={required}
        disabled={disabled}
        className="!hidden"
        onChange={changeHandler}
        name={name}
        data-cy={`${dataCy}-input`}
      />
      <Button
        size="small"
        color={color}
        onClick={handleButtonClick}
        className={clsx('!ml-0', className)}
        data-cy={dataCy}
        icon={UploadIcon}
        disabled={disabled}
      >
        {title}
      </Button>
      {tooltip && <Tooltip message={tooltip} />}

      <FileStatus
        state={state}
        value={value}
        hideFilename={hideFilename}
        required={required}
        dataCy={dataCy}
      />
    </div>
  );

  function handleButtonClick() {
    if (fileRef && fileRef.current) {
      fileRef.current.click();
    }
  }

  function changeHandler(event: ChangeEvent<HTMLInputElement>) {
    if (event.target && event.target.files && event.target.files.length > 0) {
      onChange(event.target.files[0]);
    }
  }
}

function FileStatus({
  state,
  value,
  hideFilename,
  required,
  dataCy,
}: {
  state?: 'uploading' | 'success';
  value?: File | null;
  hideFilename?: boolean;
  required?: boolean;
  dataCy?: string;
}) {
  const stateIcon = getStateIcon(state, dataCy);
  const filename = !hideFilename && value ? value.name : null;

  if (stateIcon || filename) {
    return (
      <span className="flex items-center gap-2">
        {stateIcon}
        {filename}
      </span>
    );
  }

  if (required) {
    return (
      <span data-cy={dataCy ? `${dataCy}-required-icon` : undefined}>
        <Icon icon={XCircleIcon} mode="danger" />
      </span>
    );
  }

  return null;
}

function getStateIcon(state?: 'uploading' | 'success', dataCy?: string) {
  if (state === 'uploading') {
    return (
      <span data-cy={dataCy ? `${dataCy}-uploading-icon` : undefined}>
        <Icon icon={Loader2Icon} className="animate-spin-slow" />
      </span>
    );
  }
  if (state === 'success') {
    return (
      <span data-cy={dataCy ? `${dataCy}-success-icon` : undefined}>
        <Icon icon={CheckIcon} mode="success" />
      </span>
    );
  }
  return null;
}
