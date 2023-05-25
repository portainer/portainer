package cli

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Confirm starts a rollback db cli application
func Confirm(message string) (bool, error) {
	fmt.Printf("%s [y/N]", message)

	reader := bufio.NewReader(os.Stdin)

	answer, err := reader.ReadString('\n')
	if err != nil {
		return false, err
	}

	answer = strings.ReplaceAll(answer, "\n", "")
	answer = strings.ToLower(answer)

	return answer == "y" || answer == "yes", nil
}
