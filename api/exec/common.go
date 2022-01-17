package exec

import "regexp"

var stackNameNormalizeRegex = regexp.MustCompile("[^-_a-z0-9]+")

type StringSet map[string]bool

func NewStringSet() StringSet {
	return make(StringSet)
}

func (s StringSet) Add(x string) {
	s[x] = true
}

func (s StringSet) Remove(x string) {
	if s.Contains(x) {
		delete(s, x)
	}
}

func (s StringSet) Contains(x string) bool {
	_, ok := s[x]
	return ok
}

func (s StringSet) Len() int {
	return len(s)
}

func (s StringSet) List() []string {
	list := make([]string, s.Len())

	i := 0
	for k := range s {
		list[i] = k
		i++
	}

	return list
}

func (s StringSet) Union(x StringSet) {
	if x.Len() != 0 {
		for k := range x {
			s.Add(k)
		}
	}
}
