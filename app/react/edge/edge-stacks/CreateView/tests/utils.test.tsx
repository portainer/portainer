import { HttpResponse } from 'msw';
import { render, waitFor } from '@testing-library/react';

import { UserViewModel } from '@/portainer/models/user';
import { withUserProvider } from '@/react/test-utils/withUserProvider';
import { withTestRouter } from '@/react/test-utils/withRouter';
import { withTestQueryProvider } from '@/react/test-utils/withTestQuery';
import { http, server } from '@/setup-tests/server';

import { CreateForm } from '../CreateForm';

// app templates request
// GET /api/templates
const appTemplatesResponseBody = {
  version: '3',
  templates: [
    {
      id: 54,
      type: 3,
      title: 'TOSIBOX Lock for Container',
      description:
        'Lock for Container brings secure connectivity inside your industrial IoT devices',
      administrator_only: false,
      image: '',
      repository: {
        url: 'https://github.com/portainer/templates',
        stackfile: 'stacks/tosibox/docker-compose.yml',
      },
      stackFile: '',
      logo: 'https://portainer-io-assets.sfo2.digitaloceanspaces.com/logos/tosibox.png',
      env: [
        {
          name: 'LICENSE_KEY',
          label: 'License key',
        },
      ],
      platform: 'linux',
      categories: ['edge'],
    },
  ],
};

// app template content request
// GET /api/templates/54/file
const appTemplateContentResponseBody = {
  FileContent:
    // eslint-disable-next-line no-template-curly-in-string
    'version: "3.7"\nservices:\n  tosibox-lock-for-container:\n    container_name: tosibox-lock-for-container\n    image: tosibox/lock-for-container:latest\n    hostname: tb-lfc\n    restart: unless-stopped\n    cap_add:\n      - NET_ADMIN\n      - SYS_TIME\n      - SYS_PTRACE\n    ports:\n      - 80\n    networks:\n      - tbnet\n    volumes:\n      - tosibox-lfc:/etc/tosibox/docker_volume\n    environment:\n      - LICENSE_KEY=${LICENSE_KEY}\nvolumes:\n  tosibox-lfc:\n    name: tosibox-lfc\nnetworks:\n  tbnet:\n    name: tbnet\n    ipam:\n      config:\n        - subnet: 10.10.206.0/24\n',
};

const customTemplatesResponseBody = [
  {
    Id: 8,
    Title: 'git-with-all',
    Description: 'test',
    ProjectPath: '/Users/aliharris/portainer-data-ee/custom_templates/8',
    EntryPoint: '',
    CreatedByUserId: 1,
    Note: '',
    Platform: 1,
    Logo: '',
    Type: 2,
    ResourceControl: {
      Id: 9,
      ResourceId: '8',
      SubResourceIds: [],
      Type: 8,
      UserAccesses: [
        {
          UserId: 1,
          AccessLevel: 1,
        },
      ],
      TeamAccesses: [],
      Public: false,
      AdministratorsOnly: false,
      System: false,
    },
    Variables: [],
    GitConfig: {
      URL: 'https://github.com/testA113/nginx-public',
      ReferenceName: 'refs/heads/main',
      ConfigFilePath: 'docker/voting.yaml',
      Authentication: {
        Username: '',
        Password: '',
        GitCredentialID: 0,
      },
      ConfigHash: '1db40a888e07da7d9455897aadd349d0bc83bd83',
      TLSSkipVerify: false,
    },
    IsComposeFormat: false,
    EdgeTemplate: true,
    EdgeSettings: {
      PrePullImage: true,
      RetryDeploy: true,
      PrivateRegistryId: 1,
      RelativePathSettings: {
        SupportRelativePath: true,
        FilesystemPath: '/test',
        SupportPerDeviceConfigs: true,
        PerDeviceConfigsMatchType: 'file',
        PerDeviceConfigsGroupMatchType: 'file',
        PerDeviceConfigsPath: 'test',
      },
      StaggerConfig: {
        StaggerOption: 2,
        StaggerParallelOption: 1,
        DeviceNumber: 1,
        DeviceNumberStartFrom: 0,
        DeviceNumberIncrementBy: 2,
        Timeout: '3',
        UpdateDelay: '3',
        UpdateFailureAction: 3,
      },
    },
  },
];

const edgeGroups = [
  {
    Id: 1,
    Name: 'docker',
    Dynamic: false,
    TagIds: [],
    Endpoints: [12],
    PartialMatch: false,
    HasEdgeStack: false,
    HasEdgeJob: false,
    EndpointTypes: [4],
    TrustedEndpoints: [12],
  },
  {
    Id: 2,
    Name: 'kubernetes',
    Dynamic: false,
    TagIds: [],
    Endpoints: [11],
    PartialMatch: false,
    HasEdgeStack: false,
    HasEdgeJob: false,
    EndpointTypes: [7],
    TrustedEndpoints: [11],
  },
];

const gitCredentials = [
  {
    id: 1,
    userId: 1,
    name: 'test',
    username: 'portainer-test',
    creationDate: 1732761658,
  },
];

const registries = [
  {
    Id: 1,
    Type: 6,
    Name: 'dockerhub',
    URL: 'docker.io',
    BaseURL: '',
    Authentication: true,
    Username: 'portainer-test',
    Password: 'test',
    ManagementConfiguration: {
      Type: 6,
      Authentication: true,
      Username: 'portainer-test',
      Password: 'test',
      TLSConfig: {
        TLS: false,
        TLSSkipVerify: false,
      },
      Ecr: {
        Region: '',
      },
    },
    Gitlab: {
      ProjectId: 0,
      InstanceURL: '',
      ProjectPath: '',
    },
    Quay: {
      OrganisationName: '',
    },
    Ecr: {
      Region: '',
    },
    RegistryAccesses: {},
    UserAccessPolicies: null,
    TeamAccessPolicies: null,
    AuthorizedUsers: null,
    AuthorizedTeams: null,
    Github: {
      UseOrganisation: false,
      OrganisationName: '',
    },
  },
];

mockCodeMirror();

test('The form should render', async () => {
  const { getByRole } = renderCreateForm();

  // Wait for the form to be rendered
  await waitFor(() => {
    expect(getByRole('form')).toBeInTheDocument();
  });
});

export function mockCodeMirror() {
  vi.mock('@uiw/react-codemirror', () => ({
    __esModule: true,
    default: () => <div />,
  }));
}

export function renderCreateForm() {
  // user declaration needs to go at the start for user id related requests (e.g. git credentials)
  const user = new UserViewModel({ Username: 'user' });
  server.use(
    http.get('/api/templates', () =>
      HttpResponse.json(appTemplatesResponseBody)
    )
  );
  server.use(
    http.get('/api/custom_templates', () =>
      HttpResponse.json(customTemplatesResponseBody)
    )
  );
  server.use(
    http.get('/api/custom_templates/8', () =>
      HttpResponse.json(customTemplatesResponseBody[0])
    )
  );
  server.use(
    http.post('/api/templates/54/file', () =>
      HttpResponse.json(appTemplateContentResponseBody)
    )
  );
  server.use(http.get('/api/edge_stacks', () => HttpResponse.json([])));
  server.use(http.get('/api/edge_groups', () => HttpResponse.json(edgeGroups)));
  server.use(http.get('/api/registries', () => HttpResponse.json(registries)));
  server.use(
    http.get('/api/users/1/gitcredentials', () =>
      HttpResponse.json(gitCredentials)
    )
  );
  const Wrapped = withTestQueryProvider(
    withUserProvider(withTestRouter(CreateForm), user)
  );
  return render(<Wrapped />);
}
