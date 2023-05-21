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
  id: string;
  className?: string;
  role?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  bold?: boolean;
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
      ...props
    }: Props,
    ref
  ) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    let resolvedRef = ref as MutableRefObject<HTMLInputElement | null>;
    if (!ref) {
      resolvedRef = defaultRef;
    }

    useEffect(() => {
      if (resolvedRef === null || resolvedRef.current === null) {
        return;
      }

      if (typeof indeterminate !== 'undefined') {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [resolvedRef, indeterminate]);

    return (
      <div className="md-checkbox flex" title={title || label}>
        <input
          id={id}
          type="checkbox"
          ref={resolvedRef}
          onChange={onChange}
          checked={checked}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
        <label htmlFor={id} className={clsx({ '!font-normal': !bold })}>
          {label}
        </label>
      </div>
    );
  }
);
