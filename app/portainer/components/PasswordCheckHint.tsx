import { react2angular } from '@/react-tools/react2angular';

import { MinPasswordLen } from '../helpers/password';

export function PasswordCheckHint() {
  return (
    <div>
      <p className="text-muted">
        <i
          className="fa fa-exclamation-triangle orange-icon"
          aria-hidden="true"
        />{' '}
        The password must be at least {MinPasswordLen} characters long.
      </p>
    </div>
  );
}

export const PasswordCheckHintAngular = react2angular(PasswordCheckHint, []);
