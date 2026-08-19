import { Widget, WidgetBody } from '@@/Widget';

import { SecretDetailsTable } from './SecretDetailsTable';

type Props = {
  name: string;
  namespace: string;
  secretTypeLabel: string;
  isSystem: boolean;
  registryId?: number | string;
};

export function SecretDetailsWidget({
  name,
  namespace,
  secretTypeLabel,
  isSystem,
  registryId,
}: Props) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            <SecretDetailsTable
              name={name}
              namespace={namespace}
              secretTypeLabel={secretTypeLabel}
              isSystem={isSystem}
              registryId={registryId}
            />
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
