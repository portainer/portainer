import { DefaultBodyType, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { http, server } from '@/setup-tests/server';
import selectEvent from '@/react/test-utils/react-select';

import { mockCodeMirror, renderCreateForm } from './utils.test';

// keep mockTemplateId and mockTemplateType in module scope
let mockTemplateId: number;
let mockTemplateType: string;

// browser address
// /edge/stacks/new?templateId=54&templateType=app
vi.mock('@uirouter/react', async (importOriginal: () => Promise<object>) => ({
  ...(await importOriginal()),
  useCurrentStateAndParams: vi.fn(() => ({
    params: { templateId: mockTemplateId, templateType: mockTemplateType },
  })),
}));

mockCodeMirror();

const expectedCustomTemplatePayload = {
  deploymentType: 0,
  edgeGroups: [1],
  name: 'my-stack',
  envVars: [],
  prePullImage: true,
  registries: [1],
  retryDeploy: true,
  staggerConfig: {
    StaggerOption: 2,
    StaggerParallelOption: 1,
    DeviceNumber: 1,
    DeviceNumberStartFrom: 0,
    DeviceNumberIncrementBy: 2,
    Timeout: '3',
    UpdateDelay: '3',
    UpdateFailureAction: 3,
  },
  useManifestNamespaces: false,
  repositoryUrl: 'https://github.com/testA113/nginx-public',
  repositoryUsername: '',
  repositoryReferenceName: 'refs/heads/main',
  filePathInRepository: 'docker/voting.yaml',
  repositoryAuthentication: false,
  repositoryGitCredentialId: 0,
  repositoryPassword: '',
  filesystemPath: '/test',
  supportRelativePath: true,
  perDeviceConfigsGroupMatchType: 'file',
  perDeviceConfigsMatchType: 'file',
  perDeviceConfigsPath: 'test',
  tlsSkipVerify: false,
  autoUpdate: null,
};

test('The web editor should be visible for custom templates', async () => {
  setMockCreateStackUrlParams(8, 'custom');
  const { getByRole, getByLabelText } = renderCreateForm();

  // Wait for the form to be rendered
  await waitFor(() => {
    expect(getByRole('form')).toBeInTheDocument();
  });

  // the web editor should be visible
  expect(getByLabelText('Web editor')).toBeVisible();
});

test('The form should submit the correct request body for a given custom template', async () => {
  setMockCreateStackUrlParams(8, 'custom');
  let requestBody: DefaultBodyType;
  server.use(
    http.post('/api/edge_stacks/create/repository', async ({ request }) => {
      requestBody = await request.json();
      return HttpResponse.json({});
    })
  );

  const { getByRole, getByLabelText } = renderCreateForm();

  await waitFor(() => {
    expect(getByRole('form')).toBeInTheDocument();
  });

  // fill in the name and select the docker edge group
  const user = userEvent.setup();
  await user.type(getByRole('textbox', { name: 'Name *' }), 'my-stack');
  const selectElement = getByLabelText('Edge groups');
  await selectEvent.select(selectElement, 'docker');

  // submit the form
  await user.click(getByRole('button', { name: /Deploy the stack/i }));

  // verify the request body
  await waitFor(() => {
    expect(requestBody).toEqual(expectedCustomTemplatePayload);
  });
});

function setMockCreateStackUrlParams(templateId: number, templateType: string) {
  mockTemplateId = templateId;
  mockTemplateType = templateType;
}
