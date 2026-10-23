import { LinkIcon } from 'lucide-react';

import { Icon } from '@@/Icon';
import { Card } from '@@/primitives/Card';

import { SOURCE_TYPES } from '../../types';
import { SourceDetail } from '../../queries/useSource';

import { DetailField } from './DetailField';

interface Props {
  source: SourceDetail;
}

export function ConnectionDetailsWidget({ source }: Props) {
  const typeConfig = source.type ? SOURCE_TYPES[source.type] : undefined;

  return (
    <Card.Container>
      <Card.Header
        icon={LinkIcon}
        title="Connection Details"
        subtitle="Source name, URL, and connection settings"
      />
      <Card.Body className="grid grid-cols-1 gap-4">
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Name">{source.name ?? '-'}</DetailField>
          <DetailField label="Type">
            {typeConfig ? (
              <span className="flex items-center gap-1.5">
                <Icon icon={typeConfig.icon} size="sm" />
                {typeConfig.label}
              </span>
            ) : (
              '-'
            )}
          </DetailField>
        </div>
        <DetailField label="Repository URL">
          <code
            className="bg-transparent p-0 font-mono text-sm"
            data-cy="source-url"
          >
            {source.url ?? '-'}
          </code>
        </DetailField>
      </Card.Body>
    </Card.Container>
  );
}
