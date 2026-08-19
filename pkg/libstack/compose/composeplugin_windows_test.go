package compose

import (
	"errors"
	"os"
	"testing"

	"github.com/compose-spec/compose-go/v2/types"
	"github.com/google/go-cmp/cmp"
	"github.com/portainer/portainer/pkg/libstack"
)

func Test_createProject_win(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	projectName := "create-project-test"

	defer func() {
		err := os.RemoveAll(dir)
		if err != nil {
			t.Fatalf("Failed to remove temp dir: %v", err)
		}
	}()

	testcases := []struct {
		name            string
		createFilesFn   func() []string
		configFilepaths []string
		options         libstack.Options
		expectedProject *types.Project
	}{
		{
			name: "Convert windows paths",
			createFilesFn: func() []string {
				var filepaths []string
				filepaths = append(filepaths, createFile(t, dir, "docker-compose.yml", `services:
  nginx:
    container_name: nginx
    image: nginx:latest
    volumes:
      - "C:\\Users\\Joey\\Desktop\\backend:/var/www/html"`))
				return filepaths
			},
			configFilepaths: []string{dir + "/docker-compose.yml"},
			options: libstack.Options{
				WorkingDir:  dir,
				ProjectName: projectName,
				Env:         []string{"COMPOSE_CONVERT_WINDOWS_PATHS=true"},
			},
			expectedProject: &types.Project{
				Name:       projectName,
				WorkingDir: dir,
				Services: types.Services{
					"nginx": {
						Name:          "nginx",
						ContainerName: "nginx",
						Environment:   types.MappingWithEquals{},
						Image:         "nginx:latest",
						Networks:      map[string]*types.ServiceNetworkConfig{"default": nil},
						Volumes: []types.ServiceVolumeConfig{
							{
								Type:     "bind",
								Source:   "/c/Users/Joey/Desktop/backend",
								Target:   "/var/www/html",
								ReadOnly: false,
								Bind:     &types.ServiceVolumeBind{CreateHostPath: true},
							},
						},
					},
				},
				Networks: types.Networks{"default": {Name: "create-project-test_default"}},
				ComposeFiles: []string{
					dir + "/docker-compose.yml",
				},
				Environment:      types.Mapping{"COMPOSE_PROJECT_NAME": "create-project-test", "COMPOSE_CONVERT_WINDOWS_PATHS": "true"},
				DisabledServices: types.Services{},
				Profiles:         []string{""},
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			createdFiles := tc.createFilesFn()

			defer func() {
				var errs error
				for _, f := range createdFiles {
					errs = errors.Join(errs, os.Remove(f))
				}

				if errs != nil {
					t.Fatalf("Failed to remove config files: %v", errs)
				}
			}()

			gotProject, err := createProject(t.Context(), tc.configFilepaths, tc.options)
			if err != nil {
				t.Fatalf("Failed to create new project: %v", err)
			}

			if diff := cmp.Diff(gotProject, tc.expectedProject); diff != "" {
				t.Fatalf("Projects are different:\n%s", diff)
			}
		})
	}
}
