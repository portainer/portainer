package slicesx_test

import (
	"testing"

	"github.com/portainer/portainer/api/slicesx"
)

func Test_Every(t *testing.T) {
	t.Parallel()
	test(t, slicesx.Every, "All start with an A (ok)",
		[]string{"Apple", "Avocado", "Apricot"},
		true,
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, slicesx.Every, "All start with an A (ko = some don't start with A)",
		[]string{"Apple", "Avocado", "Banana"},
		false,
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, slicesx.Every, "All are under 5 (ok)",
		[]int{1, 2, 3},
		true,
		func(i int) bool { return i < 5 },
	)
	test(t, slicesx.Every, "All are under 5 (ko = some above 10)",
		[]int{1, 2, 10},
		false,
		func(i int) bool { return i < 5 },
	)
	test(t, slicesx.Every, "All are true (ok)",
		[]struct{ x bool }{{x: true}, {x: true}, {x: true}},
		true,
		func(s struct{ x bool }) bool { return s.x })
	test(t, slicesx.Every, "All are true (ko = some are false)",
		[]struct{ x bool }{{x: true}, {x: true}, {x: false}},
		false,
		func(s struct{ x bool }) bool { return s.x })
	test(t, slicesx.Every, "Must be true on empty slice",
		[]int{},
		true,
		func(i int) bool { return i%2 == 0 },
	)
}

func Test_Some(t *testing.T) {
	t.Parallel()
	test(t, slicesx.Some, "Some start with an A (ok)",
		[]string{"Apple", "Avocado", "Banana"},
		true,
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, slicesx.Some, "Some start with an A (ko = all don't start with A)",
		[]string{"Banana", "Cherry", "Peach"},
		false,
		func(s string) bool { return s[0] == 'A' },
	)
	test(t, slicesx.Some, "Some are under 5 (ok)",
		[]int{1, 2, 30},
		true,
		func(i int) bool { return i < 5 },
	)
	test(t, slicesx.Some, "Some are under 5 (ko = all above 5)",
		[]int{10, 11, 12},
		false,
		func(i int) bool { return i < 5 },
	)
	test(t, slicesx.Some, "Some are true (ok)",
		[]struct{ x bool }{{x: true}, {x: true}, {x: false}},
		true,
		func(s struct{ x bool }) bool { return s.x },
	)
	test(t, slicesx.Some, "Some are true (ko = all are false)",
		[]struct{ x bool }{{x: false}, {x: false}, {x: false}},
		false,
		func(s struct{ x bool }) bool { return s.x },
	)
}
