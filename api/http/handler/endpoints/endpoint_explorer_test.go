package endpoints

import (
	"encoding/json"
	"fmt"
	"testing"
)

func Test_StringToStruct(t *testing.T) {
	var list ListDirResp
	err := json.Unmarshal(jsonEntry, &list)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(list)
}
