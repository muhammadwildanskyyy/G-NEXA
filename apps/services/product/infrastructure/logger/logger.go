package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/fatih/color"
	"github.com/sirupsen/logrus"
	"os"
	"product-service/config"
	"strings"
)

type CustomFormatter struct{}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	var b *bytes.Buffer
	if entry.Buffer != nil {
		b = entry.Buffer
	} else {
		b = &bytes.Buffer{}
	}

	// 1. Colors
	gray := color.New(color.FgHiBlack).SprintFunc()
	magenta := color.New(color.FgMagenta).SprintFunc()
	cyan := color.New(color.FgCyan).SprintFunc()
	yellow := color.New(color.FgYellow).SprintFunc()
	red := color.New(color.FgRed).SprintFunc()

	// 2. Timestamp [HH:mm:ss]
	timestamp := gray(fmt.Sprintf("[%s]", entry.Time.Format("15:04:05")))

	// 3. Fixed-Width Level
	var levelStr string
	switch entry.Level {
	case logrus.InfoLevel:
		levelStr = color.New(color.FgGreen, color.Bold).Sprint("INFO ")
	case logrus.WarnLevel:
		levelStr = color.New(color.FgYellow, color.Bold).Sprint("WARN ")
	case logrus.ErrorLevel, logrus.FatalLevel, logrus.PanicLevel:
		levelStr = color.New(color.FgRed, color.Bold).Sprint("ERROR")
	case logrus.DebugLevel:
		levelStr = color.New(color.FgBlue, color.Bold).Sprint("DEBUG")
	}

	// 4. Extract standard fields
	layer, _ := entry.Data["layer"].(string)
	if layer == "" {
		layer = "APP"
	}

	traceID, _ := entry.Data["trace_id"].(string)

	// 5. Build Main Line: [Time] LEVEL [service] [LAYER] [TRACE_ID]
	fmt.Fprintf(b, "%s %s %s %s ", timestamp, levelStr, magenta("[product-service]"), cyan(fmt.Sprintf("[%s]", strings.ToUpper(layer))))

	if traceID != "" {
		fmt.Fprintf(b, "%s ", yellow(fmt.Sprintf("[%s]", traceID)))
	}

	fmt.Fprintf(b, ": %s", entry.Message)

	// 6. Metadata Formatting
	data := make(logrus.Fields)
	for k, v := range entry.Data {
		if k != "layer" && k != "trace_id" && k != "user_id" && k != "func" {
			data[k] = v
		}
	}

	if len(data) > 0 {
		j, _ := json.Marshal(data)
		if string(j) != "{}" {

			fmt.Fprintf(b, "\n        %s %s", gray("->"), gray(string(j)))
		}
	}

	// 7. Error Stack Trace
	if entry.Data[logrus.ErrorKey] != nil {
		fmt.Fprintf(b, "\n%s", red(fmt.Sprintf("        [ERROR_DETAIL] %+v", entry.Data[logrus.ErrorKey])))
	}

	b.WriteByte('\n')
	return b.Bytes(), nil
}

var Log *logrus.Logger

func SetupLogger(confiq *config.AppConfig) {
	Log = logrus.New()
	Log.SetOutput(os.Stdout)
	Log.SetFormatter(&CustomFormatter{})

	if confiq.App.Env == "production" {
		Log.SetLevel(logrus.InfoLevel)
	} else {
		Log.SetLevel(logrus.DebugLevel)
	}
}

func Info(ctx context.Context, layer string, message string, fields logrus.Fields) {
	extract(ctx, fields).WithField("layer", layer).Info(message)
}

func Warn(ctx context.Context, layer string, message string, fields logrus.Fields) {
	extract(ctx, fields).WithField("layer", layer).Warn(message)
}

func Error(ctx context.Context, layer string, message string, err error, fields logrus.Fields) {
	entry := extract(ctx, fields).WithField("layer", layer)
	if err != nil {
		entry = entry.WithError(err)
	}
	entry.Error(message)
}

func Debug(ctx context.Context, layer string, message string, fields logrus.Fields) {
	extract(ctx, fields).WithField("layer", layer).Debug(message)
}

func extract(ctx context.Context, fields logrus.Fields) *logrus.Entry {
	if fields == nil {
		fields = logrus.Fields{}
	}

	if ctx != nil {

		if traceID, ok := ctx.Value("trace_id").(string); ok {
			fields["trace_id"] = traceID
		}
		if userID, ok := ctx.Value("user_id").(string); ok {
			fields["user_id"] = userID
		}
	}

	return Log.WithFields(fields)
}
