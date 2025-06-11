package main

import "github.com/ZureTz/shorter-url/app"

func main() {
	// Initialize the application
	app := &app.App{}	
	if err := app.Init("config.toml"); err != nil {
		panic(err)
	}
	app.Run()
}