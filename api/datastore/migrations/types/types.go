package types

type Migration struct {
	Version   int
	Up        func() error
	Down      func() error
	Completed bool
	Timestamp int32
	Name      string
}
