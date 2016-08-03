package main

import (
	"fmt"
	"gopkg.in/alecthomas/kingpin.v2"
	"strings"
)

// pair defines a key/value pair
type pair struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// pairList defines an array of Label
type pairList []pair

// Set implementation for Labels
func (l *pairList) Set(value string) error {
	parts := strings.SplitN(value, "=", 2)
	if len(parts) != 2 {
		return fmt.Errorf("expected NAME=VALUE got '%s'", value)
	}
	p := new(pair)
	p.Name = parts[0]
	p.Value = parts[1]
	*l = append(*l, *p)
	return nil
}

// String implementation for Labels
func (l *pairList) String() string {
	return ""
}

// IsCumulative implementation for Labels
func (l *pairList) IsCumulative() bool {
	return true
}

// LabelParser defines a custom parser for Labels flags
func pairs(s kingpin.Settings) (target *[]pair) {
	target = new([]pair)
	s.SetValue((*pairList)(target))
	return
}
