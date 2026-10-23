package cli

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	storagev1 "k8s.io/api/storage/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	kfake "k8s.io/client-go/kubernetes/fake"
)

func TestParseStorageClassDetail_IsDefault(t *testing.T) {
	t.Parallel()

	t.Run("annotation true sets isDefault", func(t *testing.T) {
		t.Parallel()
		sc := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{
				Name: "fast",
				Annotations: map[string]string{
					storageClassDefaultAnnotation: "true",
				},
			},
		}
		result := parseStorageClassDetail(sc)
		assert.True(t, result.IsDefault)
	})

	t.Run("annotation false gives isDefault=false", func(t *testing.T) {
		t.Parallel()
		sc := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{
				Name: "slow",
				Annotations: map[string]string{
					storageClassDefaultAnnotation: "false",
				},
			},
		}
		result := parseStorageClassDetail(sc)
		assert.False(t, result.IsDefault)
	})

	t.Run("missing annotation gives isDefault=false", func(t *testing.T) {
		t.Parallel()
		sc := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{Name: "no-annotation"},
		}
		result := parseStorageClassDetail(sc)
		assert.False(t, result.IsDefault)
	})
}

func TestSetDefaultStorageClass(t *testing.T) {
	t.Parallel()

	t.Run("sets default annotation on target SC", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{Name: "standard"},
		}
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.SetDefaultStorageClass("standard")
		require.NoError(t, err)

		result, err := k.GetStorageClass("standard")
		require.NoError(t, err)
		assert.True(t, result.IsDefault)
	})

	t.Run("removes default annotation from previously-default SC", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		oldDefault := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{
				Name: "old-default",
				Annotations: map[string]string{
					storageClassDefaultAnnotation: "true",
				},
			},
		}
		newDefault := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{Name: "new-default"},
		}

		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), oldDefault, metav1.CreateOptions{})
		require.NoError(t, err)
		_, err = k.cli.StorageV1().StorageClasses().Create(t.Context(), newDefault, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.SetDefaultStorageClass("new-default")
		require.NoError(t, err)

		old, err := k.GetStorageClass("old-default")
		require.NoError(t, err)
		assert.False(t, old.IsDefault)

		newSC, err := k.GetStorageClass("new-default")
		require.NoError(t, err)
		assert.True(t, newSC.IsDefault)
	})

	t.Run("no-op if target is already default", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		sc := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{
				Name: "already-default",
				Annotations: map[string]string{
					storageClassDefaultAnnotation: "true",
				},
			},
		}
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		err = k.SetDefaultStorageClass("already-default")
		require.NoError(t, err)

		result, err := k.GetStorageClass("already-default")
		require.NoError(t, err)
		assert.True(t, result.IsDefault)
	})

	t.Run("handles multiple SCs where only one was previously default", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		scs := []*storagev1.StorageClass{
			{
				ObjectMeta: metav1.ObjectMeta{
					Name: "sc-default",
					Annotations: map[string]string{
						storageClassDefaultAnnotation: "true",
					},
				},
			},
			{ObjectMeta: metav1.ObjectMeta{Name: "sc-other-1"}},
			{ObjectMeta: metav1.ObjectMeta{Name: "sc-other-2"}},
			{ObjectMeta: metav1.ObjectMeta{Name: "sc-target"}},
		}

		for _, sc := range scs {
			_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
			require.NoError(t, err)
		}

		err := k.SetDefaultStorageClass("sc-target")
		require.NoError(t, err)

		target, err := k.GetStorageClass("sc-target")
		require.NoError(t, err)
		assert.True(t, target.IsDefault)

		oldDefault, err := k.GetStorageClass("sc-default")
		require.NoError(t, err)
		assert.False(t, oldDefault.IsDefault)

		for _, name := range []string{"sc-other-1", "sc-other-2"} {
			sc, err := k.GetStorageClass(name)
			require.NoError(t, err)
			assert.False(t, sc.IsDefault)
		}
	})
}

func TestGetStorageClasses(t *testing.T) {
	t.Parallel()

	t.Run("empty cluster returns empty slice", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())
		scs, err := k.GetStorageClasses()
		require.NoError(t, err)
		assert.Empty(t, scs)
	})

	t.Run("returns all SCs with correct fields", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		allowExpansion := true
		sc := &storagev1.StorageClass{
			ObjectMeta: metav1.ObjectMeta{
				Name: "fast",
				Annotations: map[string]string{
					storageClassDefaultAnnotation: "true",
				},
			},
			Provisioner:          "kubernetes.io/aws-ebs",
			AllowVolumeExpansion: &allowExpansion,
		}
		_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
		require.NoError(t, err)

		scs, err := k.GetStorageClasses()
		require.NoError(t, err)
		require.Len(t, scs, 1)

		got := scs[0]
		assert.Equal(t, "fast", got.Name)
		assert.Equal(t, "kubernetes.io/aws-ebs", got.Provisioner)
		assert.True(t, got.IsDefault)
		require.NotNil(t, got.AllowVolumeExpansion)
		assert.True(t, *got.AllowVolumeExpansion)
	})
}

func TestDeleteStorageClasses(t *testing.T) {
	t.Parallel()

	t.Run("deletes specified SCs", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		for _, name := range []string{"sc-a", "sc-b", "sc-c"} {
			sc := &storagev1.StorageClass{
				ObjectMeta: metav1.ObjectMeta{Name: name},
			}
			_, err := k.cli.StorageV1().StorageClasses().Create(t.Context(), sc, metav1.CreateOptions{})
			require.NoError(t, err)
		}

		err := k.DeleteStorageClasses([]string{"sc-a", "sc-c"})
		require.NoError(t, err)

		scs, err := k.GetStorageClasses()
		require.NoError(t, err)
		require.Len(t, scs, 1)
		assert.Equal(t, "sc-b", scs[0].Name)
	})

	t.Run("returns error for non-existent SC", func(t *testing.T) {
		t.Parallel()
		k := NewTestKubeClient(kfake.NewClientset())

		err := k.DeleteStorageClasses([]string{"does-not-exist"})
		assert.Error(t, err)
	})
}
