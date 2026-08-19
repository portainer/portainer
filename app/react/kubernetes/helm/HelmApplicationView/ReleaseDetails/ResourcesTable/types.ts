import { StatusBadgeType } from '@@/StatusBadge';

export type ResourceLink = {
  to?: string;
  params?: Record<string, string>;
};

export type ResourceRow = {
  // for the table row id
  id: string;
  // for the table row name (link to resource if available)
  name: {
    label: string;
    link: ResourceLink | null;
  };
  resourceType: string;
  describe: {
    name: string;
    resourceType?: string;
    namespace?: string;
  };
  status: {
    label: string;
    type: StatusBadgeType;
  };
  statusMessage: string;
};
