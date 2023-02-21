import { TextTip } from '@@/Tip/TextTip';

interface Props {
  showSystemResources: boolean;
}

export function ServicesDatatableDescription({ showSystemResources }: Props) {
  if (showSystemResources) {
    return null;
  }

  return (
    <div className="w-full">
      <TextTip color="blue" className="!mb-0">
        System resources are hidden, this can be changed in the table settings
      </TextTip>
    </div>
  );
}
