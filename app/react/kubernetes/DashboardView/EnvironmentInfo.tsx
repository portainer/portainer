import { Gauge } from 'lucide-react';

import { stripProtocol } from '@/portainer/filters/filters';
import { useTagsForEnvironment } from '@/portainer/tags/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironment } from '@/react/portainer/environments/queries';

import { Widget, WidgetTitle, WidgetBody } from '@@/Widget';

export function EnvironmentInfo() {
  const environmentId = useEnvironmentId();
  const { data: environmentData, ...environmentQuery } =
    useEnvironment(environmentId);
  const tagsQuery = useTagsForEnvironment(environmentId);
  const tagNames = tagsQuery.tags?.map((tag) => tag.Name).join(', ') || '-';

  return (
    <Widget>
      <WidgetTitle icon={Gauge} title="Environment info" />
      <WidgetBody loading={environmentQuery.isLoading}>
        {environmentQuery.isError && <div>Failed to load environment</div>}
        {environmentData && (
          <table className="table">
            <tbody>
              <tr>
                <td className="!border-none !pl-0">Environment</td>
                <td
                  className="!border-none"
                  data-cy="dashboard-environmentName"
                >
                  {environmentData.Name}
                </td>
              </tr>
              <tr>
                <td className="!border-t !pl-0">URL</td>
                <td className="!border-t" data-cy="dashboard-environmenturl">
                  {stripProtocol(environmentData.URL) || '-'}
                </td>
              </tr>
              <tr>
                <td className="!pl-0">Tags</td>
                <td data-cy="dashboard-environmentTags">{tagNames}</td>
              </tr>
            </tbody>
          </table>
        )}
      </WidgetBody>
    </Widget>
  );
}
