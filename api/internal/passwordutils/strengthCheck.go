package passwordutils

import (
	"regexp"
)

const MinPasswordLen = 12

func lengthCheck(password string) bool {
	return len(password) >= MinPasswordLen
}

func comboCheck(password string) bool {
	count := 0
	regexps := [4]*regexp.Regexp{
		regexp.MustCompile(`[a-z]`),
		regexp.MustCompile(`[A-Z]`),
		regexp.MustCompile(`[0-9]`),
		regexp.MustCompile(`[\W_]`),
	}

	for _, re := range regexps {
		if re.FindString(password) != "" {
			count += 1
		}
	}

	return count >= 3
}

func StrengthCheck(password string) bool {
	return lengthCheck(password) && comboCheck(password)
}
