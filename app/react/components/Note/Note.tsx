import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronRight, Edit } from 'lucide-react';

import { Button } from '@@/buttons';
import { FormError } from '@@/form-components/FormError';

export type Props = {
  onChange: (value: string) => void;
  defaultIsOpen?: boolean;
  value?: string;
  labelClass?: string;
  inputClass?: string;
  isRequired?: boolean;
  minLength?: number;
  isExpandable?: boolean;
};

export function Note({
  onChange,
  defaultIsOpen,
  value,
  labelClass = 'col-sm-12 mb-2',
  inputClass = 'col-sm-12',
  isRequired,
  minLength,
  isExpandable,
}: Props) {
  const [isNoteOpen, setIsNoteOpen] = useState(defaultIsOpen || isRequired);

  useEffect(() => {
    setIsNoteOpen(defaultIsOpen || isRequired);
  }, [defaultIsOpen, isRequired]);

  let error = '';
  if (isRequired && minLength && (!value || value.length < minLength)) {
    error = `You have entered ${value ? value.length : 0} of the ${minLength} ${
      minLength === 1 ? 'character' : 'characters'
    } minimum required.`;
  }

  return (
    <div className="form-group">
      <div className={clsx('vertical-center', labelClass)}>
        {isExpandable && (
          <Button
            size="small"
            type="button"
            color="none"
            data-cy="k8sAppDetail-expandNoteButton"
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className="!m-0 !p-0"
          >
            {isNoteOpen ? <ChevronUp /> : <ChevronRight />} <Edit />
            <span className={isRequired ? 'required' : ''}>Note</span>
          </Button>
        )}
        {!isExpandable && (
          <span
            className={clsx(
              'control-label text-left',
              isRequired ? 'required' : ''
            )}
          >
            Note
          </span>
        )}
      </div>

      {isNoteOpen && (
        <div className={inputClass}>
          <textarea
            className="form-control resize-y"
            name="application_note"
            id="application_note"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            placeholder="Enter a note about this application..."
            minLength={minLength}
          />
          {error && (
            <FormError className="error-inline mt-2">{error}</FormError>
          )}
        </div>
      )}
    </div>
  );
}
