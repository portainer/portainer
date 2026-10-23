import { TextTip } from '@@/Tip/TextTip';

export function SetupTokenTextTip() {
  return (
    <TextTip color="blue">
      Find this token in the Portainer server logs. See the{' '}
      <a
        href="https://docs.portainer.io/faqs/installing/setup-token"
        target="_blank"
        rel="noreferrer"
      >
        setup token FAQ
      </a>{' '}
      for more information.
    </TextTip>
  );
}
