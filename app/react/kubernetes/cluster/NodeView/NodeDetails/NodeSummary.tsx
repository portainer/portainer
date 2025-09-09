import { Node, Endpoints } from 'kubernetes-types/core/v1';
import { useMemo } from 'react';

import { formatDate } from '@/portainer/filters/filters';
import {
  getRole,
  getInternalNodeIpAddress,
  getNodeApiDetails,
  getNodeStatus,
  getAvailability,
} from '@/react/kubernetes/cluster/nodeUtils';

import { Badge } from '@@/Badge';
import { DetailsTable } from '@@/DetailsTable';
import { StatusBadge, StatusBadgeType } from '@@/StatusBadge';
import { PortainerSelect, Option } from '@@/form-components/PortainerSelect';
import { FormError } from '@@/form-components/FormError';

import { NodeAvailability } from '../../types';

type Props = {
  node: Node;
  endpoints: Endpoints[];
  availability: NodeAvailability;
  error?: string;
  onChangeAvailability: (availability: NodeAvailability) => void;
  hasNodeWriteAccess: boolean;
};

const availabilityOptions: Option<NodeAvailability>[] = [
  {
    label: 'Active',
    value: 'Active',
  },
  {
    label: 'Pause',
    value: 'Pause',
  },
  {
    label: 'Drain',
    value: 'Drain',
  },
];

export function NodeSummary({
  node,
  endpoints,
  availability,
  onChangeAvailability,
  hasNodeWriteAccess,
  error,
}: Props) {
  const parsedNode = useMemo(
    () => parseNodeValues(node, endpoints),
    [node, endpoints]
  );

  return (
    <DetailsTable dataCy="node-summary">
      <tr>
        <td className="col-sm-3">Hostname</td>
        <td>
          {parsedNode.name}
          {parsedNode.isApi && (
            <Badge type="info" className="ml-2">
              api
            </Badge>
          )}
        </td>
      </tr>
      {parsedNode.isApi && (
        <tr>
          <td>Kubernetes API</td>
          <td>{`${parsedNode.ipAddress}:${parsedNode.apiPort}`}</td>
        </tr>
      )}
      <tr>
        <td>Role</td>
        <td>{parsedNode.role}</td>
      </tr>
      <tr>
        <td>Kubelet version</td>
        <td>{parsedNode.version || '-'}</td>
      </tr>
      <tr>
        <td>Creation date</td>
        <td>{parsedNode.creationDate || '-'}</td>
      </tr>
      <tr>
        <td>Status</td>
        <td>
          <div className="flex items-center">
            <StatusBadge color={parsedNode.statusType}>
              {parsedNode.status}
            </StatusBadge>
            {parsedNode.status === 'Warning' && parsedNode.warningMessage && (
              <span className="text-warning ml-2">
                {parsedNode.warningMessage}
              </span>
            )}
          </div>
        </td>
      </tr>
      <tr>
        <td>Availability</td>
        <td>
          {hasNodeWriteAccess ? (
            <>
              <PortainerSelect
                options={availabilityOptions}
                value={availability}
                onChange={(value) => {
                  if (value) {
                    onChangeAvailability(value);
                  }
                }}
                data-cy="node-availability-select"
                inputId="node-availability-select"
                aria-label="Availability"
              />
              <FormError>{error}</FormError>
            </>
          ) : (
            availability
          )}
        </td>
      </tr>
    </DetailsTable>
  );
}

interface ParsedNodeData {
  name: string;
  isApi: boolean;
  ipAddress?: string;
  apiPort?: number;
  role: string;
  version?: string;
  creationDate?: string;
  status: string;
  statusType: StatusBadgeType;
  warningMessage?: string;
  availability: NodeAvailability;
}

function parseNodeValues(node: Node, endpoints: Endpoints[]): ParsedNodeData {
  const name = node.metadata?.name || '';
  const ipAddress = getInternalNodeIpAddress(node);
  const { apiPort, isApi } = getNodeApiDetails(node, endpoints);
  const role = getRole(node);
  const version = node.status?.nodeInfo?.kubeletVersion;
  const creationDate = node.metadata?.creationTimestamp
    ? formatDate(node.metadata.creationTimestamp)
    : undefined;
  const { status, statusType, warningMessage } = getNodeStatus(node);
  const availability = getAvailability(node);
  return {
    name,
    isApi,
    ipAddress,
    apiPort,
    role,
    version,
    creationDate,
    status,
    statusType,
    availability,
    warningMessage,
  };
}
