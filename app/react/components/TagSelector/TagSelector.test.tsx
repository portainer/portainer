import { Tag, TagId } from '@/portainer/tags/types';
import { renderWithQueryClient } from '@/react-tools/test-utils';
import { server, rest } from '@/setup-tests/server';

import { TagSelector } from './TagSelector';

test('should show a message when no tags and allowCreate is false', async () => {
  const { getByText } = await renderComponent({ allowCreate: false }, []);

  expect(
    getByText('No tags available. Head over to the', {
      exact: false,
    })
  ).toBeInTheDocument();
});

test('should show the selected tags', async () => {
  const tags: Tag[] = [
    {
      ID: 1,
      Name: 'tag1',
    },
    {
      ID: 2,
      Name: 'tag2',
    },
  ];

  const selectedTags = [tags[1]];

  const { getByText } = await renderComponent(
    { value: selectedTags.map((t) => t.ID) },
    tags
  );

  expect(getByText(selectedTags[0].Name)).toBeInTheDocument();
});
async function renderComponent(
  {
    value = [],
    allowCreate = false,
    onChange = jest.fn(),
  }: {
    value?: TagId[];
    allowCreate?: boolean;
    onChange?: jest.Mock;
  } = {},
  tags: Tag[] = []
) {
  server.use(rest.get('/api/tags', (_req, res, ctx) => res(ctx.json(tags))));

  const queries = renderWithQueryClient(
    <TagSelector value={value} allowCreate={allowCreate} onChange={onChange} />
  );

  const tagElement = await queries.findAllByText('tags', { exact: false });

  expect(tagElement.length).toBeGreaterThanOrEqual(1);

  return queries;
}
