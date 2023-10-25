import { Minus, Plus } from 'lucide-react';
import { PropsWithChildren, useState } from 'react';

import { Button } from '@@/buttons';

export function AdvancedSettingsToggle({
  children,
}: PropsWithChildren<unknown>) {
  const [advanced, setAdvanced] = useState(false);
  return (
    <>
      <div className="form-group col-sm-12">
        <Button
          color="none"
          className="small interactive"
          onClick={() => setAdvanced(!advanced)}
          icon={advanced ? Minus : Plus}
        >
          {advanced ? 'Hide' : 'Show'} advanced options
        </Button>
      </div>

      {advanced ? children : null}
    </>
  );
}
