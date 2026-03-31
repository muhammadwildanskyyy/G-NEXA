package config

type AppConfig struct {
	App           APP                 `mapstructure:"APP"`
	Elasticsearch ElasticsearchConfig `mapstructure:"ELASTICSEARCH"`
	Databasee     DatabaseConfig      `mapstructure:"DATABASE"`
	Kafka         KafkaConfig         `mapstructure:"KAFKA"`
	HostService   HostServices        `mapstructure:"HOST_SERVICES"`
	Redis         RedisConfig         `mapstructure:"REDIS"`
}

type APP struct {
	Port       string `mapstructure:"PORT"`
	GrpcPort   string `mapstructure:"GRPC_PORT"`
	AuthSecret string `mapstructure:"AUTH_SECRET"`
	Env        string `mapstructure:"ENV"`
}

type ElasticsearchConfig struct {
	Address string `mapstructure:"ADDRESS"`
	Index   string `mapstructure:"INDEX"`
}

type KafkaConfig struct {
	Broker     string `mapstructure:"BROKER"`
	TopicOrder string `mapstructure:"TOPIC_ORDER"`
}

type DatabaseConfig struct {
	ConnectionURI string `mapstructure:"URI"` // Menjadi String tunggal
	Name          string `mapstructure:"NAME"`
}

type HostServices struct {
	UserService string `mapstructure:"USER_SERVICE"`
	UserGrpcUrl string `mapstructure:"USER_GRPC_URL"`
}

type RedisConfig struct {
	Addr     string `mapstructure:"ADDR"`
	Password string `mapstructure:"PASSWORD"`
	DB       int    `mapstructure:"DB"`
}
