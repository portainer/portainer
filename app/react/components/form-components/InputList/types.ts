export type DefaultType = { value: string; needsDeletion?: boolean };
export type Key = string | number;
type ChangeType = 'delete' | 'create' | 'update';

export type OnChangeEvent<T> =
  | {
      item: T;
      type: ChangeType;
    }
  | {
      type: 'move';
      fromIndex: number;
      to: number;
    };
