import styles from './BoxSelector.module.css';
import { BoxSelectorItem } from './BoxSelectorItem';
import { BoxSelectorOption, Value } from './types';

interface IsMultiProps<T extends Value> {
  isMulti: true;
  value: T[];
  onChange(value: T[], limitedToBE: boolean): void;
}

interface SingleProps<T extends Value> {
  isMulti?: never;
  value: T;
  onChange(value: T, limitedToBE: boolean): void;
}

type Union<T extends Value> = IsMultiProps<T> | SingleProps<T>;

export type Props<T extends Value> = Union<T> & {
  radioName: string;
  options: ReadonlyArray<BoxSelectorOption<T>> | Array<BoxSelectorOption<T>>;
  slim?: boolean;
};

export function BoxSelector<T extends Value>({
  radioName,
  options,
  slim = false,
  ...props
}: Props<T>) {
  return (
    <div className="form-group">
      <div className="col-sm-12">
        <div className={styles.root} role="radiogroup">
          {options
            .filter((option) => !option.hide)
            .map((option) => (
              <BoxSelectorItem
                key={option.id}
                radioName={radioName}
                option={option}
                onSelect={handleSelect}
                disabled={option.disabled && option.disabled()}
                tooltip={option.tooltip && option.tooltip()}
                type={props.isMulti ? 'checkbox' : 'radio'}
                isSelected={isSelected}
                slim={slim}
              />
            ))}
        </div>
      </div>
    </div>
  );

  function handleSelect(optionValue: T, limitedToBE: boolean) {
    if (props.isMulti) {
      const newValue = isSelected(optionValue)
        ? props.value.filter((v) => v !== optionValue)
        : [...props.value, optionValue];
      props.onChange(newValue, limitedToBE);
      return;
    }

    if (isSelected(optionValue)) {
      return;
    }

    props.onChange(optionValue, limitedToBE);
  }

  function isSelected(optionValue: T) {
    if (props.isMulti) {
      return props.value.includes(optionValue);
    }

    return props.value === optionValue;
  }
}
