package config

type AppConfig struct {
	App           APP                 `mapstructure:"APP"`
	Elasticsearch ElasticsearchConfig `mapstructure:"ELASTICSEARCH"`
	Database      DatabaseConfig      `mapstructure:"DATABASE"`
	Kafka         KafkaConfig         `mapstructure:"KAFKA"`
	Cloudinary    Cloudinary          `mapstructure:"CLOUDINARY"`
}

type APP struct {
	Port       string `mapstructure:"PORT"`
	AuthSecret string `mapstructure:"AUTH_SECRET"`
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
	Password      string `mapstructure:"PASSWORD"`
	User          string `mapstructure:"USER"`
}

type Cloudinary struct {
	CLOUDINARY_URL    string `mapstructure:"CLOUDINARY_URL"`
	CLOUDINARY_FOLDER string `mapstructure:"CLOUDINARY_FOLDER"`
}
