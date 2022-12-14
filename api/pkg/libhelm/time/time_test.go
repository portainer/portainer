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

package time

import (
	"encoding/json"
	"testing"
	"time"
)

var (
	testingTime, _    = Parse(time.RFC3339, "1977-09-02T22:04:05Z")
	testingTimeString = `"1977-09-02T22:04:05Z"`
)

func TestNonZeroValueMarshal(t *testing.T) {
	res, err := json.Marshal(testingTime)
	if err != nil {
		t.Fatal(err)
	}
	if testingTimeString != string(res) {
		t.Errorf("expected a marshaled value of %s, got %s", testingTimeString, res)
	}
}

func TestZeroValueMarshal(t *testing.T) {
	res, err := json.Marshal(Time{})
	if err != nil {
		t.Fatal(err)
	}
	if string(res) != emptyString {
		t.Errorf("expected zero value to marshal to empty string, got %s", res)
	}
}

func TestNonZeroValueUnmarshal(t *testing.T) {
	var myTime Time
	err := json.Unmarshal([]byte(testingTimeString), &myTime)
	if err != nil {
		t.Fatal(err)
	}
	if !myTime.Equal(testingTime) {
		t.Errorf("expected time to be equal to %v, got %v", testingTime, myTime)
	}
}

func TestEmptyStringUnmarshal(t *testing.T) {
	var myTime Time
	err := json.Unmarshal([]byte(emptyString), &myTime)
	if err != nil {
		t.Fatal(err)
	}
	if !myTime.IsZero() {
		t.Errorf("expected time to be equal to zero value, got %v", myTime)
	}
}

func TestZeroValueUnmarshal(t *testing.T) {
	// This test ensures that we can unmarshal any time value that was output
	// with the current go default value of "0001-01-01T00:00:00Z"
	var myTime Time
	err := json.Unmarshal([]byte(`"0001-01-01T00:00:00Z"`), &myTime)
	if err != nil {
		t.Fatal(err)
	}
	if !myTime.IsZero() {
		t.Errorf("expected time to be equal to zero value, got %v", myTime)
	}
}
