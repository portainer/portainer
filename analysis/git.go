//go:build ignore

package gorules

import "github.com/quasilyte/go-ruleguard/dsl"

// inMemoryCloneWithWorktree flags git clone calls that use memory.NewStorage() as
// the storer while also writing files to a real worktree. This holds all git objects
// in heap for the duration of the clone, which is unbounded for user-supplied repos.
func inMemoryCloneWithWorktree(m dsl.Matcher) {
	m.Match(`git.CloneContext($_, memory.NewStorage(), $wt, $_)`).
		Where(m["wt"].Text != "nil").
		Report(`git.CloneContext with memory.NewStorage() holds all git objects in heap; use gogitfs.NewStorage with a filesystem storer instead`)

	m.Match(`git.Clone(memory.NewStorage(), $wt, $_)`).
		Where(m["wt"].Text != "nil").
		Report(`git.Clone with memory.NewStorage() holds all git objects in heap; use gogitfs.NewStorage with a filesystem storer instead`)
}
