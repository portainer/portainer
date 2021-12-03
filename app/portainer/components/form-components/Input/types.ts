export interface InputProps {
  id?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface ChangeProps<T> {
  value: T;
  onChange(value: T): void;
}
