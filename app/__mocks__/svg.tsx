import { forwardRef } from 'react';

const SvgrMock = forwardRef<HTMLSpanElement>((props, ref) => (
  // eslint-disable-next-line react/jsx-props-no-spreading
  <span ref={ref} {...props} />
));

export default SvgrMock;
