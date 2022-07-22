package log

import (
	"log"
)

const (
	ErrorLevel = iota
	WarnLevel
	InfoLevel
	DebugLevel
	TraceLevel
)

var level = InfoLevel

func SetLevel(logLevel int) {
	level = logLevel
}

func Panic(msg string, args ...any) {
	log.Panicf(msg, args...)
}

func Fatal(msg string, args ...any) {
	log.Fatalf(msg, args...)
}

func Error(msg string, args ...any) {
	log.Printf("[ERROR] "+msg, args...)
}

func Warn(msg string, args ...any) {
	if level >= WarnLevel {
		log.Printf("[WARN] "+msg, args...)
	}
}

func Info(msg string, args ...any) {
	if level >= InfoLevel {
		log.Printf("[INFO] "+msg, args...)
	}
}

func Debug(msg string, args ...any) {
	if level >= DebugLevel {
		log.Printf("[DEBUG] "+msg, args...)
	}
}

func Trace(msg string, args ...any) {
	if level >= TraceLevel {
		log.Printf("[TRACE] "+msg, args...)
	}
}
