import { TextTip } from '@@/Tip/TextTip';

interface Props {
  showSystemResources: boolean;
}

export function SystemResourceDescription({ showSystemResources }: Props) {
  return (
    <div className="w-full">
      {!showSystemResources && (
        <TextTip color="blue" className="!mb-0">
          System resources are hidden, this can be changed in the table settings
        </TextTip>
      )}
    </div>
  );
}
