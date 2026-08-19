package roar

import (
	"slices"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRoar(t *testing.T) {
	t.Parallel()
	r := Roar[int]{}
	require.Equal(t, 0, r.Len())

	r.Add(1)
	require.Equal(t, 1, r.Len())
	require.True(t, r.Contains(1))
	require.False(t, r.Contains(2))

	r.Add(2)
	require.Equal(t, 2, r.Len())
	require.True(t, r.Contains(2))

	r.Remove(1)
	require.Equal(t, 1, r.Len())
	require.False(t, r.Contains(1))

	s := FromSlice([]int{3, 4, 5})
	require.Equal(t, 3, s.Len())
	require.True(t, s.Contains(3))
	require.True(t, s.Contains(4))
	require.True(t, s.Contains(5))

	r.Union(s)
	require.Equal(t, 4, r.Len())
	require.True(t, r.Contains(2))
	require.True(t, r.Contains(3))
	require.True(t, r.Contains(4))
	require.True(t, r.Contains(5))

	r.Iterate(func(id int) bool {
		require.True(t, slices.Contains([]int{2, 3, 4, 5}, id))

		return true
	})

	rSlice := r.ToSlice()
	require.Equal(t, []int{2, 3, 4, 5}, rSlice)

	r.Intersection(FromSlice([]int{4}))
	require.Equal(t, 1, r.Len())
	require.True(t, r.Contains(4))
	require.False(t, r.Contains(2))
	require.False(t, r.Contains(3))
	require.False(t, r.Contains(5))

	b, err := r.MarshalJSON()
	require.NoError(t, err)
	require.NotEqual(t, "null", string(b))
	require.True(t, strings.HasPrefix(string(b), `"`))
	require.True(t, strings.HasSuffix(string(b), `"`))
}

func TestNilSafety(t *testing.T) {
	t.Parallel()
	var r, s, u Roar[int]

	r.Iterate(func(id int) bool {
		require.Fail(t, "should not iterate over nil Roar")

		return true
	})

	b, err := r.MarshalJSON()
	require.NoError(t, err)
	require.Equal(t, "null", string(b))

	err = r.UnmarshalJSON([]byte("null"))
	require.NoError(t, err)
	require.Equal(t, 0, r.Len())

	r.Contains(1)
	r.Remove(1)

	require.Equal(t, 0, r.Len())
	require.Empty(t, r.ToSlice())

	r.Add(1)
	require.Equal(t, 1, r.Len())
	require.False(t, r.Contains(2))

	s.Union(r)
	require.Equal(t, 1, s.Len())
	require.True(t, s.Contains(1))

	r.Union(u)
	require.Equal(t, 1, r.Len())
	require.True(t, r.Contains(1))

	s.Intersection(u)
	require.Equal(t, 0, s.Len())

	u.Intersection(r)
	require.Equal(t, 0, u.Len())
}

func TestJSON(t *testing.T) {
	t.Parallel()
	var r, u Roar[int]

	r.Add(1)
	r.Add(2)
	r.Add(3)

	b, err := r.MarshalJSON()
	require.NoError(t, err)
	require.NotEqual(t, "null", string(b))

	err = u.UnmarshalJSON(b)
	require.NoError(t, err)
	require.Equal(t, 3, u.Len())
	require.True(t, u.Contains(1))
	require.True(t, u.Contains(2))
	require.True(t, u.Contains(3))
}
