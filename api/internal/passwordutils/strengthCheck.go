package passwordutils

const MinPasswordLen = 12

func lengthCheck(password string) bool {
	return len(password) >= MinPasswordLen
}

func StrengthCheck(password string) bool {
	return lengthCheck(password)
}
