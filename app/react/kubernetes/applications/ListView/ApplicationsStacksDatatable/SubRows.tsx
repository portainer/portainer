import clsx from 'clsx';

import KubernetesApplicationHelper from '@/kubernetes/helpers/application';
import KubernetesNamespaceHelper from '@/kubernetes/helpers/namespaceHelper';

import { Link } from '@@/Link';
import { ExternalBadge } from '@@/Badge/ExternalBadge';

import { KubernetesStack } from '../../types';

export function SubRows({
  stack,
  span,
}: {
  stack: KubernetesStack;
  span: number;
}) {
  return (
    <>
      {stack.Applications.map((app) => (
        <tr
          className={clsx({
            'datatable-highlighted': stack.Highlighted,
            'datatable-unhighlighted': !stack.Highlighted,
          })}
          key={app.Name}
        >
          <td />
          <td colSpan={span - 1}>
            <div className="flex gap-2">
              <Link
                to="kubernetes.applications.application"
                params={{ name: app.Name, namespace: app.ResourcePool }}
              >
                {app.Name}
              </Link>
              {KubernetesNamespaceHelper.isSystemNamespace(app.ResourcePool) &&
                KubernetesApplicationHelper.isExternalApplication(app) && (
                  <ExternalBadge />
                )}
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}
