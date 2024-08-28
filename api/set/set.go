package set

type SetKey interface {
	~int | ~string
}

type Set[T SetKey] map[T]bool

// Add adds a key to the set.
func (s Set[T]) Add(key T) {
	s[key] = true
}

// Contains returns true if the set contains the key.
func (s Set[T]) Contains(key T) bool {
	_, ok := s[key]

	return ok
}

// Remove removes a key from the set.
func (s Set[T]) Remove(key T) {
	delete(s, key)
}

// Len returns the number of keys in the set.
func (s Set[T]) Len() int {
	return len(s)
}

// IsEmpty returns true if the set is empty.
func (s Set[T]) IsEmpty() bool {
	return len(s) == 0
}

// Clear removes all keys from the set.
func (s Set[T]) Keys() []T {
	keys := make([]T, s.Len())

	i := 0
	for k := range s {
		keys[i] = k
		i++
	}

	return keys
}

// Clear removes all keys from the set.
func (s Set[T]) Copy() Set[T] {
	c := make(Set[T])

	for key := range s {
		c.Add(key)
	}

	return c
}

// Difference returns a new set containing the keys that are in the first set but not in the second set.
func (s Set[T]) Difference(second Set[T]) Set[T] {
	difference := s.Copy()

	for key := range second {
		difference.Remove(key)
	}

	return difference
}

// Union returns a new set containing the keys that are in either set.
func Union[T SetKey](sets ...Set[T]) Set[T] {
	union := make(Set[T])

	for _, set := range sets {
		for key := range set {
			union.Add(key)
		}
	}

	return union
}

// Intersection returns a new set containing the keys that are in all sets.
func Intersection[T SetKey](sets ...Set[T]) Set[T] {
	if len(sets) == 0 {
		return make(Set[T])
	}

	intersection := sets[0].Copy()

	for _, set := range sets[1:] {
		for key := range intersection {
			if !set.Contains(key) {
				intersection.Remove(key)
			}
		}
	}

	return intersection
}

// ToSet returns a new set containing the keys.
func ToSet[T SetKey](keys []T) Set[T] {
	set := make(Set[T])
	for _, key := range keys {
		set.Add(key)
	}

	return set
}
