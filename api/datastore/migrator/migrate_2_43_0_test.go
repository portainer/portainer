package migrator

import (
	"testing"

	portainer "github.com/portainer/portainer/api"
	"github.com/portainer/portainer/api/database/boltdb"
	"github.com/portainer/portainer/api/dataservices/customtemplate"
	"github.com/portainer/portainer/api/dataservices/source"
	"github.com/portainer/portainer/api/dataservices/stack"
	"github.com/portainer/portainer/api/dataservices/workflow"
	gittypes "github.com/portainer/portainer/api/git/types"
	"github.com/portainer/portainer/api/logs"

	"github.com/stretchr/testify/require"
)

func TestMigrateGitConfigToSources_2_43_0_GitStackMigrated(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	gitStack := &portainer.Stack{
		ID:   1,
		Name: "git-stack",
		GitConfig: &gittypes.RepoConfig{
			URL:           "https://github.com/example/repo",
			ReferenceName: "refs/heads/main",
			ConfigHash:    "abc123",
		},
	}
	err = conn.CreateObjectWithId(stack.BucketName, int(gitStack.ID), gitStack)
	require.NoError(t, err)

	err = m.migrateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	migrated, err := stackSvc.Read(gitStack.ID)
	require.NoError(t, err)
	require.NotZero(t, migrated.WorkflowID)
	require.Nil(t, migrated.GitConfig)

	wf, err := workflowSvc.Read(migrated.WorkflowID)
	require.NoError(t, err)
	require.Len(t, wf.Artifacts, 1)
	require.Len(t, wf.Artifacts[0].Files, 1)

	src, err := sourceSvc.Read(wf.Artifacts[0].Files[0].SourceID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceTypeGit, src.Type)
	require.Equal(t, gitStack.GitConfig.URL, src.Git.URL)
	require.Equal(t, gitStack.GitConfig.ReferenceName, src.Git.ReferenceName)
}

func TestMigrateGitConfigToSources_2_43_0_NonGitStackUntouched(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	plainStack := &portainer.Stack{
		ID:   1,
		Name: "plain-stack",
	}
	err = conn.CreateObjectWithId(stack.BucketName, int(plainStack.ID), plainStack)
	require.NoError(t, err)

	err = m.migrateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	result, err := stackSvc.Read(plainStack.ID)
	require.NoError(t, err)
	require.Zero(t, result.WorkflowID)
	require.Nil(t, result.GitConfig)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Empty(t, sources)

	workflows, err := workflowSvc.ReadAll()
	require.NoError(t, err)
	require.Empty(t, workflows)
}

func TestMigrateGitConfigToSources_2_43_0_DuplicateSourcesDeduped(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	sharedURL := "https://github.com/example/shared-repo"

	stack1 := &portainer.Stack{
		ID:   1,
		Name: "stack-a",
		GitConfig: &gittypes.RepoConfig{
			URL:           sharedURL,
			ReferenceName: "refs/heads/main",
		},
	}
	stack2 := &portainer.Stack{
		ID:   2,
		Name: "stack-b",
		GitConfig: &gittypes.RepoConfig{
			URL:           sharedURL,
			ReferenceName: "refs/heads/develop",
		},
	}
	err = conn.CreateObjectWithId(stack.BucketName, int(stack1.ID), stack1)
	require.NoError(t, err)
	err = conn.CreateObjectWithId(stack.BucketName, int(stack2.ID), stack2)
	require.NoError(t, err)

	err = m.migrateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 1, "two stacks with the same URL must share one Source")

	workflows, err := workflowSvc.ReadAll()
	require.NoError(t, err)
	require.Len(t, workflows, 2, "each stack must get its own Workflow")

	sharedSourceID := sources[0].ID
	for _, wf := range workflows {
		require.Len(t, wf.Artifacts, 1)
		require.Len(t, wf.Artifacts[0].Files, 1)
		require.Equal(t, sharedSourceID, wf.Artifacts[0].Files[0].SourceID)
	}
}

func TestMigrateGitConfigToSources_2_43_0_Idempotent(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	workflowSvc, err := workflow.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:    stackSvc,
		SourceService:   sourceSvc,
		WorkflowService: workflowSvc,
	})

	gitStack := &portainer.Stack{
		ID:   1,
		Name: "git-stack",
		GitConfig: &gittypes.RepoConfig{
			URL: "https://github.com/example/repo",
		},
	}
	err = conn.CreateObjectWithId(stack.BucketName, int(gitStack.ID), gitStack)
	require.NoError(t, err)

	err = m.migrateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	// Second run must not create duplicate Source/Workflow records
	err = m.migrateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 1)

	workflows, err := workflowSvc.ReadAll()
	require.NoError(t, err)
	require.Len(t, workflows, 1)
}

func TestMigrateCustomTemplateGitConfigToSources_2_43_0_GitTemplateMigrated(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	customTemplateSvc, err := customtemplate.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:          stackSvc,
		SourceService:         sourceSvc,
		CustomTemplateService: customTemplateSvc,
	})

	tmpl := &portainer.CustomTemplate{
		ID: 1,
		GitConfig: &gittypes.RepoConfig{
			URL:            "https://github.com/example/repo",
			ReferenceName:  "refs/heads/main",
			ConfigFilePath: "docker-compose.yml",
			ConfigHash:     "abc123",
		},
	}
	err = conn.CreateObjectWithId(customtemplate.BucketName, int(tmpl.ID), tmpl)
	require.NoError(t, err)

	err = m.migrateCustomTemplateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	migrated, err := customTemplateSvc.Read(tmpl.ID)
	require.NoError(t, err)
	require.NotNil(t, migrated.Artifact)
	require.Nil(t, migrated.GitConfig)
	require.Len(t, migrated.Artifact.Files, 1)
	require.Equal(t, "refs/heads/main", migrated.Artifact.Files[0].Ref)
	require.Equal(t, "docker-compose.yml", migrated.Artifact.Files[0].Path)
	require.Equal(t, "abc123", migrated.Artifact.Files[0].Hash)

	src, err := sourceSvc.Read(migrated.Artifact.Files[0].SourceID)
	require.NoError(t, err)
	require.Equal(t, portainer.SourceTypeGit, src.Type)
	require.Equal(t, "https://github.com/example/repo", src.Git.URL)
}

func TestMigrateCustomTemplateGitConfigToSources_2_43_0_NonGitTemplateUntouched(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	customTemplateSvc, err := customtemplate.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:          stackSvc,
		SourceService:         sourceSvc,
		CustomTemplateService: customTemplateSvc,
	})

	tmpl := &portainer.CustomTemplate{ID: 1, Title: "plain-template"}
	err = conn.CreateObjectWithId(customtemplate.BucketName, int(tmpl.ID), tmpl)
	require.NoError(t, err)

	err = m.migrateCustomTemplateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	result, err := customTemplateSvc.Read(tmpl.ID)
	require.NoError(t, err)
	require.Nil(t, result.Artifact)
	require.Nil(t, result.GitConfig)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Empty(t, sources)
}

func TestMigrateCustomTemplateGitConfigToSources_2_43_0_AlreadyMigratedSkipped(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	customTemplateSvc, err := customtemplate.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:          stackSvc,
		SourceService:         sourceSvc,
		CustomTemplateService: customTemplateSvc,
	})

	// Template already has Artifact set (already migrated)
	srcID := portainer.SourceID(99)
	tmpl := &portainer.CustomTemplate{
		ID: 1,
		GitConfig: &gittypes.RepoConfig{
			URL: "https://github.com/example/repo",
		},
		Artifact: &portainer.Artifact{
			Files: []portainer.ArtifactFile{{SourceID: srcID}},
		},
	}
	err = conn.CreateObjectWithId(customtemplate.BucketName, int(tmpl.ID), tmpl)
	require.NoError(t, err)

	err = m.migrateCustomTemplateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Empty(t, sources, "no new sources should be created for already-migrated templates")
}

func TestMigrateCustomTemplateGitConfigToSources_2_43_0_DuplicateSourcesDeduped(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	customTemplateSvc, err := customtemplate.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:          stackSvc,
		SourceService:         sourceSvc,
		CustomTemplateService: customTemplateSvc,
	})

	sharedURL := "https://github.com/example/shared-repo"

	tmpl1 := &portainer.CustomTemplate{
		ID:    1,
		Title: "template-a",
		GitConfig: &gittypes.RepoConfig{
			URL:           sharedURL,
			ReferenceName: "refs/heads/main",
		},
	}
	tmpl2 := &portainer.CustomTemplate{
		ID:    2,
		Title: "template-b",
		GitConfig: &gittypes.RepoConfig{
			URL:           sharedURL,
			ReferenceName: "refs/heads/develop",
		},
	}
	err = conn.CreateObjectWithId(customtemplate.BucketName, int(tmpl1.ID), tmpl1)
	require.NoError(t, err)
	err = conn.CreateObjectWithId(customtemplate.BucketName, int(tmpl2.ID), tmpl2)
	require.NoError(t, err)

	err = m.migrateCustomTemplateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 1, "two templates with the same URL must share one Source")

	sharedSrcID := sources[0].ID

	migrated1, err := customTemplateSvc.Read(tmpl1.ID)
	require.NoError(t, err)
	require.NotNil(t, migrated1.Artifact)
	require.Equal(t, sharedSrcID, migrated1.Artifact.Files[0].SourceID)

	migrated2, err := customTemplateSvc.Read(tmpl2.ID)
	require.NoError(t, err)
	require.NotNil(t, migrated2.Artifact)
	require.Equal(t, sharedSrcID, migrated2.Artifact.Files[0].SourceID)
}

func TestMigrateCustomTemplateGitConfigToSources_2_43_0_Idempotent(t *testing.T) {
	t.Parallel()

	conn := &boltdb.DbConnection{Path: t.TempDir()}
	err := conn.Open()
	require.NoError(t, err)
	defer logs.CloseAndLogErr(conn)

	stackSvc, err := stack.NewService(conn)
	require.NoError(t, err)
	sourceSvc, err := source.NewService(conn)
	require.NoError(t, err)
	customTemplateSvc, err := customtemplate.NewService(conn)
	require.NoError(t, err)

	m := NewMigrator(&MigratorParameters{
		StackService:          stackSvc,
		SourceService:         sourceSvc,
		CustomTemplateService: customTemplateSvc,
	})

	tmpl := &portainer.CustomTemplate{
		ID: 1,
		GitConfig: &gittypes.RepoConfig{
			URL: "https://github.com/example/repo",
		},
	}
	err = conn.CreateObjectWithId(customtemplate.BucketName, int(tmpl.ID), tmpl)
	require.NoError(t, err)

	err = m.migrateCustomTemplateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	// Second run must not create duplicate Source records
	err = m.migrateCustomTemplateGitConfigToSources_2_43_0()
	require.NoError(t, err)

	sources, err := sourceSvc.ReadAll()
	require.NoError(t, err)
	require.Len(t, sources, 1)
}
