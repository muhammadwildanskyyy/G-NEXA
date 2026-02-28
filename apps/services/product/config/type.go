package config

type AppConfig struct {
	App           APP                 `mapstructure:"APP"`
	Elasticsearch ElasticsearchConfig `mapstructure:"ELASTICSEARCH"`
	Databasee     DatabaseConfig      `mapstructure:"DATABASE"`
	Kafka         KafkaConfig         `mapstructure:"KAFKA"`
	HostService   HostServices        `mapstructure:"HOST_SERVICES"`
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
	ConnectionURI string `mapstructure:"URI"` // Menjadi String tunggal
	Name          string `mapstructure:"NAME"`
}

type HostServices struct {
	UserService string `mapstructure:"USER_SERVICE"`
}
