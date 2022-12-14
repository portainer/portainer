/*
Copyright The Helm Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Package time contains a wrapper for time.Time in the standard library and
// associated methods. This package mainly exists to workaround an issue in Go
// where the serializer doesn't omit an empty value for time:
// https://github.com/golang/go/issues/11939. As such, this can be removed if a
// proposal is ever accepted for Go
package time

import (
	"bytes"
	"time"
)

// emptyString contains an empty JSON string value to be used as output
var emptyString = `""`

// Time is a convenience wrapper around stdlib time, but with different
// marshalling and unmarshaling for zero values
type Time struct {
	time.Time
}

// Now returns the current time. It is a convenience wrapper around time.Now()
func Now() Time {
	return Time{time.Now()}
}

func (t Time) MarshalJSON() ([]byte, error) {
	if t.Time.IsZero() {
		return []byte(emptyString), nil
	}

	return t.Time.MarshalJSON()
}

func (t *Time) UnmarshalJSON(b []byte) error {
	if bytes.Equal(b, []byte("null")) {
		return nil
	}
	// If it is empty, we don't have to set anything since time.Time is not a
	// pointer and will be set to the zero value
	if bytes.Equal([]byte(emptyString), b) {
		return nil
	}

	return t.Time.UnmarshalJSON(b)
}

func Parse(layout, value string) (Time, error) {
	t, err := time.Parse(layout, value)
	return Time{Time: t}, err
}
func ParseInLocation(layout, value string, loc *time.Location) (Time, error) {
	t, err := time.ParseInLocation(layout, value, loc)
	return Time{Time: t}, err
}

func Date(year int, month time.Month, day, hour, min, sec, nsec int, loc *time.Location) Time {
	return Time{Time: time.Date(year, month, day, hour, min, sec, nsec, loc)}
}

func Unix(sec int64, nsec int64) Time { return Time{Time: time.Unix(sec, nsec)} }

func (t Time) Add(d time.Duration) Time { return Time{Time: t.Time.Add(d)} }
func (t Time) AddDate(years int, months int, days int) Time {
	return Time{Time: t.Time.AddDate(years, months, days)}
}
func (t Time) After(u Time) bool             { return t.Time.After(u.Time) }
func (t Time) Before(u Time) bool            { return t.Time.Before(u.Time) }
func (t Time) Equal(u Time) bool             { return t.Time.Equal(u.Time) }
func (t Time) In(loc *time.Location) Time    { return Time{Time: t.Time.In(loc)} }
func (t Time) Local() Time                   { return Time{Time: t.Time.Local()} }
func (t Time) Round(d time.Duration) Time    { return Time{Time: t.Time.Round(d)} }
func (t Time) Sub(u Time) time.Duration      { return t.Time.Sub(u.Time) }
func (t Time) Truncate(d time.Duration) Time { return Time{Time: t.Time.Truncate(d)} }
func (t Time) UTC() Time                     { return Time{Time: t.Time.UTC()} }
