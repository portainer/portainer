import clsx from 'clsx';
import {
  forwardRef,
  useRef,
  useEffect,
  MutableRefObject,
  ChangeEventHandler,
  HTMLProps,
} from 'react';

interface Props extends HTMLProps<HTMLInputElement> {
  checked?: boolean;
  indeterminate?: boolean;
  title?: string;
  label?: string;
  id?: string;
  className?: string;
  role?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  bold?: boolean;
  'data-cy': string;
}

export const Checkbox = forwardRef<HTMLInputElement, Props>(
  (
    {
      indeterminate,
      title,
      label,
      id,
      checked,
      onChange,
      bold = true,
      'data-cy': dataCy,
      ...props
    }: Props,
    ref
  ) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    let resolvedRef = ref as MutableRefObject<HTMLInputElement | null>;
    if (!ref) {
      resolvedRef = defaultRef;
    }

    // Need to check this on every render as the browser will always set the element's
    // indeterminate state to false when the checkbox is clicked, even if the indeterminate prop hasn't changed
    useEffect(() => {
      if (resolvedRef === null || resolvedRef.current === null) {
        return;
      }

      if (typeof indeterminate !== 'undefined') {
        resolvedRef.current.indeterminate = indeterminate;
      }
    });

    return (
      <div className="md-checkbox flex items-center" title={title || label}>
        <input
          id={id}
          type="checkbox"
          ref={resolvedRef}
          onChange={onChange}
          checked={checked}
          data-cy={dataCy}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
        <label htmlFor={id} className={clsx('m-0', { '!font-normal': !bold })}>
          {label}
        </label>
      </div>
    );
  }
);
