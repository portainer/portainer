package set

type SetKey interface {
	~int | ~string
}

type Set[T SetKey] map[T]bool

func (s Set[T]) Add(key T) {
	s[key] = true
}

func (s Set[T]) Contains(key T) bool {
	_, ok := s[key]
	return ok
}

func (s Set[T]) Remove(key T) {
	delete(s, key)
}

func (s Set[T]) Len() int {
	return len(s)
}

func (s Set[T]) IsEmpty() bool {
	return len(s) == 0
}

func (s Set[T]) Keys() []T {
	keys := make([]T, s.Len())

	i := 0
	for k := range s {
		keys[i] = k
		i++
	}

	return keys
}
