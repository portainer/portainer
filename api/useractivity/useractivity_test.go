package useractivity

import "fmt"

func setup(path string) (*Store, error) {
	store, err := NewUserActivityStore(path)
	if err != nil {
		return nil, fmt.Errorf("Failed creating new store: %w", err)
	}

	return store, nil
}
