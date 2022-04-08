package main

import (
	"fmt"
	"os"
)

func main() {
	// Read file '.pwd'
	pwd, err := os.ReadFile(".pwd")
	if err != nil {
		panic(err)
	}
	fmt.Print(pwd)
}
