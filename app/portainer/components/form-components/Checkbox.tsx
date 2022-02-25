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
}

export const Checkbox = forwardRef<HTMLInputElement, Props>(
  (
    { indeterminate, title, label, id, checked, onChange, ...props }: Props,
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
      <div className="md-checkbox" title={title || label}>
        <input
          id={id}
          type="checkbox"
          ref={resolvedRef}
          onChange={onChange}
          checked={checked}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...props}
        />
        <label htmlFor={id}>{label}</label>
      </div>
    );
  }
);
