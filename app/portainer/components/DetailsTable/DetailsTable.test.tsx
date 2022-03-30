import { render } from '@/react-tools/test-utils';

import { DetailsTable, DetailsRow } from './index';

// should display child row elements
test('should display child row elements', () => {
  const person = {
    name: 'Bob',
    id: 'dmsjs1532',
  };

  const { queryByText } = render(
    <DetailsTable>
      <DetailsRow keyProp="Name">{person.name}</DetailsRow>
      <DetailsRow keyProp="Id">{person.id}</DetailsRow>
    </DetailsTable>
  );

  const nameRow = queryByText(person.name);
  expect(nameRow).toBeVisible();

  const idRow = queryByText(person.id);
  expect(idRow).toBeVisible();
});
