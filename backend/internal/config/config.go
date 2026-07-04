package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Database    DatabaseConfig    `mapstructure:"database"`
	Bot         BotConfig         `mapstructure:"bot"`
	Categorizer CategorizerConfig `mapstructure:"categorizer"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Name     string `mapstructure:"name"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
}

func (d DatabaseConfig) DSN() string {
	sslMode := "disable"
	if IsProduction() {
		sslMode = "require"
	}
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, sslMode,
	)
}

type BotConfig struct {
	Token string `mapstructure:"token"`
}

type CategorizerConfig struct {
	Provider     string `mapstructure:"provider"`
	AnthropicKey string `mapstructure:"anthropic_key"`
	OpenCodeURL  string `mapstructure:"opencode_url"`
}

func IsProduction() bool {
	return strings.ToLower(os.Getenv("ENV")) == "production"
}

func Load(configPath ...string) *Config {
	if len(configPath) > 0 && configPath[0] != "" {
		viper.SetConfigFile(configPath[0])
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")
	}

	// Environment variable overrides
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Bind specific env vars
	viper.BindEnv("database.host", "DB_HOST")
	viper.BindEnv("database.port", "DB_PORT")
	viper.BindEnv("database.name", "DB_NAME")
	viper.BindEnv("database.user", "DB_USER")
	viper.BindEnv("database.password", "DB_PASSWORD")
	viper.BindEnv("bot.token", "BOT_TOKEN")
	viper.BindEnv("categorizer.provider", "CATEGORIZER_PROVIDER")
	viper.BindEnv("categorizer.anthropic_key", "ANTHROPIC_API_KEY")
	viper.BindEnv("categorizer.opencode_url", "OPENCODE_BASE_URL")

	// Defaults
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("categorizer.provider", "opencode")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			fmt.Printf("Error reading config file: %v\n", err)
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		fmt.Printf("Error unmarshaling config: %v\n", err)
	}

	return &cfg
}
