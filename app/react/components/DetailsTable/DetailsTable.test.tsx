import { render } from '@testing-library/react';

import { DetailsTable } from './index';

// should display child row elements
test('should display child row elements', () => {
  const person = {
    name: 'Bob',
    id: 'dmsjs1532',
  };

  const { queryByText } = render(
    <DetailsTable dataCy="details-table">
      <DetailsTable.Row label="Name">{person.name}</DetailsTable.Row>
      <DetailsTable.Row label="Id">{person.id}</DetailsTable.Row>
    </DetailsTable>
  );

  const nameRow = queryByText(person.name);
  expect(nameRow).toBeVisible();

  const idRow = queryByText(person.id);
  expect(idRow).toBeVisible();
});
