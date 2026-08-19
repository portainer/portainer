import { TextTip } from '@@/Tip/TextTip';

interface Props {
  isSwarm: boolean;
  composeSyntaxMaxVersion?: number;
}

export function DeploymentInfo({ isSwarm, composeSyntaxMaxVersion }: Props) {
  if (isSwarm) {
    return (
      <div className="form-group">
        <div className="col-sm-12">
          <span className="text-muted small">
            This stack will be deployed using the equivalent of the{' '}
            <code>docker stack deploy</code> command.
          </span>
        </div>
      </div>
    );
  }

  if (composeSyntaxMaxVersion === 2) {
    return (
      <div className="form-group">
        <div className="col-sm-12">
          <div className="text-muted small mb-2">
            This stack will be deployed using the equivalent of{' '}
            <code>docker compose</code>. Only Compose file format version{' '}
            <b>2</b> is supported at the moment.
          </div>
          <TextTip color="orange">
            Note: Due to a limitation of libcompose, the name of the stack will
            be standardized to remove all special characters and uppercase
            letters.
          </TextTip>
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <div className="col-sm-12">
        <span className="text-muted small">
          This stack will be deployed using <code>docker compose</code>.
        </span>
      </div>
    </div>
  );
}
