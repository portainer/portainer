import { Option } from '@@/form-components/PortainerSelect';

interface Props<T extends string | number> {
  options: Array<Option<T>> | ReadonlyArray<Option<T>>;
  selectedOption: T;
  name: string;
  onOptionChange: (value: T) => void;
}

export function RadioGroup<T extends string | number = string>({
  options,
  selectedOption,
  name,
  onOptionChange,
}: Props<T>) {
  return (
    <div>
      {options.map((option) => (
        <span
          key={option.value}
          className="col-sm-3 col-lg-2 control-label !p-0 text-left"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={selectedOption === option.value}
            onChange={() => onOptionChange(option.value)}
            style={{ margin: '0 4px 0 0' }}
          />
          {option.label}
        </span>
      ))}
    </div>
  );
}
