import { react2angular } from '@/react-tools/react2angular';

export function Loading() {
  return (
    <div className="loading">
      <div className="double-bounce1" />
      <div className="double-bounce2" />
    </div>
  );
}

export const LoadingAngular = react2angular(Loading, []);
