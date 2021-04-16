package exec

import (
	"os/exec"
	"path/filepath"
	"runtime"
)

func osProgram(program string) string {
	if runtime.GOOS == "windows" {
		program += ".exe"
	}
	return program
}

func programPath(rootPath, program string) string {
	return filepath.Join(rootPath, osProgram(program))
}

// IsBinaryPresent returns true if corresponding program exists on PATH
func IsBinaryPresent(program string) bool {
	_, err := exec.LookPath(program)
	return err == nil
}
