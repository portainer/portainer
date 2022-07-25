import { PropsWithChildren, useState } from 'react';

import { FormSectionTitle } from '../FormSectionTitle';

interface Props {
  title: string;
  isFoldable?: boolean;
}

export function FormSection({
  title,
  children,
  isFoldable = false,
}: PropsWithChildren<Props>) {
  const [isExpanded, setIsExpanded] = useState(!isFoldable);

  return (
    <>
      <FormSectionTitle htmlFor={isFoldable ? `foldingButton${title}` : ''}>
        {isFoldable && (
          <button
            id={`foldingButton${title}`}
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-0 mx-2 bg-transparent inline-flex justify-center items-center w-2"
          >
            <i
              className={`fa fa-caret-${isExpanded ? 'down' : 'right'}`}
              aria-hidden="true"
            />
          </button>
        )}

        {title}
      </FormSectionTitle>

      {isExpanded && children}
    </>
  );
}
