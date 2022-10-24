import { useQuery } from 'react-query';
import _ from 'lodash';

import { useUIState } from '@/portainer/hooks/useUIState';

import { InformationPanel } from '@@/InformationPanel';

import { getMotd } from './home.service';

export function MotdPanel() {
  const motd = useMotd();

  const uiStateStore = useUIState();

  if (
    !motd ||
    motd.Message === '' ||
    motd.Hash === uiStateStore.dismissedInfoHash
  ) {
    return null;
  }

  return (
    <>
      {!!motd.Style && <style>{motd.Style}</style>}
      <InformationPanel
        onDismiss={() => onDismiss(motd.Hash)}
        title={motd.Title}
        wrapperStyle={camelCaseKeys(motd.ContentLayout)}
        bodyClassName="motd-body"
      >
        <span className="text-muted">
          {/* eslint-disable-next-line react/no-danger */}
          <p dangerouslySetInnerHTML={{ __html: motd.Message }} />
        </span>
      </InformationPanel>
    </>
  );

  function onDismiss(hash: string) {
    uiStateStore.dismissMotd(hash);
  }
}

function useMotd() {
  const { data } = useQuery('motd', () => getMotd());
  return data;
}

function camelCaseKeys(obj: Record<string, string> = {}) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      const camelCased = _.camelCase(key);
      return [camelCased, value];
    })
  );
}
