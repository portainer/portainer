import { AutomationTestingProps } from '@/types';

import { FormSection } from '@@/form-components/FormSection';
import { SwitchField } from '@@/form-components/SwitchField';

interface AutoUserProvisionToggleProps extends Partial<AutomationTestingProps> {
  value: boolean;
  onChange: (value: boolean) => void;
  description: string;
}

export function AutoUserProvisionToggle({
  value,
  onChange,
  description,
  'data-cy': dataCy = 'auto-user-provision-toggle',
}: AutoUserProvisionToggleProps) {
  return (
    <FormSection title="Automatic user provisioning">
      <div className="form-group">
        <span className="col-sm-12 text-muted small">{description}</span>
      </div>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Automatic user provisioning"
            checked={value}
            onChange={onChange}
            data-cy={dataCy}
          />
        </div>
      </div>
    </FormSection>
  );
}
