import { render } from '@/react-tools/test-utils';

import { DetailsTable, DetailsTableKeyValueRow } from './index';

// should display child row elements
test('should display child row elements', () => {
  const person = {
    name: 'Bob',
    id: 'dmsjs1532',
  };

  const { queryByText } = render(
    <DetailsTable>
      <DetailsTableKeyValueRow keyProp="Name">
        {person.name}
      </DetailsTableKeyValueRow>
      <DetailsTableKeyValueRow keyProp="Id">
        {person.id}
      </DetailsTableKeyValueRow>
    </DetailsTable>
  );

  const nameRow = queryByText(person.name);
  expect(nameRow).toBeVisible();

  const idRow = queryByText(person.id);
  expect(idRow).toBeVisible();
});
