package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

var Log *logrus.Logger

func SetupLogger() {
	log := logrus.New()

	// Output ke Stdout (Terminal)
	log.SetOutput(os.Stdout)

	// Format text berwarna agar gampang dibaca mata manusia
	log.SetFormatter(&logrus.TextFormatter{
		ForceColors:     true,
		FullTimestamp:   true,
		TimestampFormat: "2006-01-02 15:04:05", // Format jam Indonesia
		PadLevelText:    true,                  // Meratakan text level (INFO, WARN)
	})

	// Set Level (Debug agar semua info keluar saat development)
	log.SetLevel(logrus.DebugLevel)

	log.Infoln("🚀 Logger initialized with Logrus")
	Log = log
}

func LogError(fields logrus.Fields, message string, function string, err error) {
	Log.WithFields(fields).
		WithError(err).
		Error(message + ". Got err on function :" + function)

}
