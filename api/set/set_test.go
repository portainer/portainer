package set

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestAdd(t *testing.T) {
	t.Parallel()

	s := make(Set[int])
	s.Add(1)
	s.Add(2)
	s.Add(2)

	require.Equal(t, 2, s.Len())
	require.True(t, s.Contains(1))
	require.True(t, s.Contains(2))
}

func TestContains(t *testing.T) {
	t.Parallel()

	s := make(Set[string])
	s.Add("hello")

	require.True(t, s.Contains("hello"))
	require.False(t, s.Contains("world"))
}

func TestRemove(t *testing.T) {
	t.Parallel()

	s := make(Set[int])
	s.Add(1)
	s.Add(2)
	s.Remove(1)
	s.Remove(99)

	require.Equal(t, 1, s.Len())
	require.False(t, s.Contains(1))
	require.True(t, s.Contains(2))
}

func TestIsEmpty(t *testing.T) {
	t.Parallel()

	s := make(Set[int])
	require.True(t, s.IsEmpty())

	s.Add(1)
	require.False(t, s.IsEmpty())

	s.Remove(1)
	require.True(t, s.IsEmpty())
}

func TestKeys(t *testing.T) {
	t.Parallel()

	s := ToSet([]int{1, 2, 3})
	keys := s.Keys()

	require.Len(t, keys, 3)
	require.ElementsMatch(t, []int{1, 2, 3}, keys)
}

func TestCopy(t *testing.T) {
	t.Parallel()

	original := ToSet([]string{"a", "b", "c"})
	copied := original.Copy()

	require.Equal(t, original.Len(), copied.Len())
	require.True(t, copied.Contains("a"))
	require.True(t, copied.Contains("b"))
	require.True(t, copied.Contains("c"))

	copied.Add("d")
	require.False(t, original.Contains("d"))

	copied.Remove("a")
	require.True(t, original.Contains("a"))
}

func TestDifference(t *testing.T) {
	t.Parallel()

	a := ToSet([]int{1, 2, 3, 4})
	b := ToSet([]int{3, 4, 5})

	diff := a.Difference(b)

	require.Equal(t, 2, diff.Len())
	require.True(t, diff.Contains(1))
	require.True(t, diff.Contains(2))
	require.False(t, diff.Contains(3))
	require.False(t, diff.Contains(4))
}

func TestDifference_EmptySecond(t *testing.T) {
	t.Parallel()

	a := ToSet([]int{1, 2, 3})
	b := make(Set[int])

	diff := a.Difference(b)

	require.Equal(t, 3, diff.Len())
}

func TestDifference_EmptyFirst(t *testing.T) {
	t.Parallel()

	a := make(Set[int])
	b := ToSet([]int{1, 2, 3})

	diff := a.Difference(b)

	require.True(t, diff.IsEmpty())
}

func TestUnion(t *testing.T) {
	t.Parallel()

	a := ToSet([]int{1, 2})
	b := ToSet([]int{2, 3})
	c := ToSet([]int{3, 4})

	u := Union(a, b, c)

	require.Equal(t, 4, u.Len())
	require.True(t, u.Contains(1))
	require.True(t, u.Contains(2))
	require.True(t, u.Contains(3))
	require.True(t, u.Contains(4))
}

func TestUnion_NoSets(t *testing.T) {
	t.Parallel()

	u := Union[int]()
	require.True(t, u.IsEmpty())
}

func TestIntersection(t *testing.T) {
	t.Parallel()

	a := ToSet([]int{1, 2, 3})
	b := ToSet([]int{2, 3, 4})
	c := ToSet([]int{3, 4, 5})

	inter := Intersection(a, b, c)

	require.Equal(t, 1, inter.Len())
	require.True(t, inter.Contains(3))
}

func TestIntersection_NoOverlap(t *testing.T) {
	t.Parallel()

	a := ToSet([]int{1, 2})
	b := ToSet([]int{3, 4})

	inter := Intersection(a, b)

	require.True(t, inter.IsEmpty())
}

func TestIntersection_NoSets(t *testing.T) {
	t.Parallel()

	inter := Intersection[int]()
	require.True(t, inter.IsEmpty())
}

func TestIntersection_SingleSet(t *testing.T) {
	t.Parallel()

	a := ToSet([]int{1, 2, 3})
	inter := Intersection(a)

	require.Equal(t, 3, inter.Len())
}

func TestToSet(t *testing.T) {
	t.Parallel()

	keys := []string{"x", "y", "x"}
	s := ToSet(keys)

	require.Equal(t, 2, s.Len())
	require.True(t, s.Contains("x"))
	require.True(t, s.Contains("y"))
}

func TestToSet_Empty(t *testing.T) {
	t.Parallel()

	s := ToSet([]int{})
	require.True(t, s.IsEmpty())
}
