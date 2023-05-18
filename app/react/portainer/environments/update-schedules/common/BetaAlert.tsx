import { TextTip } from '@@/Tip/TextTip';

interface Props {
  message: string;
  className?: string;
  isHtml?: boolean;
}

export function BetaAlert({ message, className, isHtml }: Props) {
  return (
    <TextTip
      icon="svg-beta"
      className={className}
      childrenWrapperClassName="text-warning"
    >
      {!isHtml ? (
        message
      ) : (
        // eslint-disable-next-line react/no-danger
        <span dangerouslySetInnerHTML={{ __html: message }} />
      )}
    </TextTip>
  );
}
