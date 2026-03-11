package config

type AppConfig struct {
	App           APP                 `mapstructure:"APP"`
	Elasticsearch ElasticsearchConfig `mapstructure:"ELASTICSEARCH"`
	Database      DatabaseConfig      `mapstructure:"DATABASE"`
	Kafka         KafkaConfig         `mapstructure:"KAFKA"`
	HostService   HostServices        `mapstructure:"HOST_SERVICES"`
	Xendit        Xendit              `mapstructure:"XENDIT"`
}

type APP struct {
	Port       string `mapstructure:"PORT"`
	AuthSecret string `mapstructure:"AUTH_SECRET"`
	Env        string `mapstructure:"ENV"`
}

type ElasticsearchConfig struct {
	Address string `mapstructure:"ADDRESS"`
	Index   string `mapstructure:"INDEX"`
}

type KafkaConfig struct {
	Broker string `mapstructure:"BROKER"`
	Topic  string `mapstructure:"TOPIC"`
}

type DatabaseConfig struct {
	ConnectionURI string `mapstructure:"URI"`
	Name          string `mapstructure:"NAME"`
	Host          string `mapstructure:"HOST"`
	Port          string `mapstructure:"PORT"`
	User          string `mapstructure:"USER"`
	Password      string `mapstructure:"PASSWORD"`
}

type HostServices struct {
	UserService string `mapstructure:"USER_SERVICE"`
}

type Xendit struct {
	APIKey        string `mapstructure:"API_KEY"`
	WebhookSecret string `mapstructure:"WEBHOOK_SECRET"`
}
