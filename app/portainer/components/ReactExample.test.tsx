import { render } from '@/react-tools/test-utils';

import { ReactExample } from './ReactExample';

test('loads component', async () => {
  const text = 'hello';

  const { getByText } = render(<ReactExample text={text} />);

  expect(getByText(text)).toBeInTheDocument();
});
