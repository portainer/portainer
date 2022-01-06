import { useQuery } from 'react-query';
import _ from 'lodash-es';

import { useUIState } from '@/common/hooks/UIStateProvider';

import { Button } from '../components/Button';
import { Widget, WidgetBody } from '../components/widget';

import { getMotd } from './home.service';

export function MotdPanel() {
  const motd = useMotd();

  const [uiState, setUIState] = useUIState();

  if (!motd || motd.Message === '' || motd.Hash === uiState.dismissedInfoHash) {
    return null;
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody className="motd-body">
            {!!motd.Style && <style>{motd.Style}</style>}
            <div style={camelCaseKeys(motd.ContentLayout)}>
              <div className="col-sm-12 form-section-title">
                <span style={{ float: 'left' }}>{motd.Title}</span>
                <span className="small" style={{ float: 'right' }}>
                  <Button color="link" onClick={() => onDismiss(motd.Hash)}>
                    <i className="fa fa-times" /> dismiss
                  </Button>
                </span>
              </div>
              <div className="form-group">
                <span className="text-muted">
                  {/* eslint-disable-next-line react/no-danger */}
                  <p dangerouslySetInnerHTML={{ __html: motd.Message }} />
                </span>
              </div>
            </div>
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  function onDismiss(hash: string) {
    setUIState({
      ...uiState,
      dismissedInfoHash: hash,
    });
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
