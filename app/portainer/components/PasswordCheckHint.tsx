import { react2angular } from '@/react-tools/react2angular';

import { MinPasswordLen } from '../helpers/password';

export function ForcePasswordUpdateHint() {
  return (
    <div>
      <p>
        <i
          className="fa fa-exclamation-triangle orange-icon"
          aria-hidden="true"
        />
        <b> Please update your password to continue </b>
      </p>

      <p className="text-muted">
        The password must be at least {MinPasswordLen} characters long.
      </p>
    </div>
  );
}

export function PasswordCheckHint() {
  return (
    <div>
      <p className="text-muted">
        <i className="fa fa-times red-icon space-right" aria-hidden="true">
          {' '}
        </i>
        <span>
          The password must be at least {MinPasswordLen} characters long.
        </span>
      </p>
    </div>
  );
}

export const ForcePasswordUpdateHintAngular = react2angular(
  ForcePasswordUpdateHint,
  []
);
export const PasswordCheckHintAngular = react2angular(PasswordCheckHint, []);
