default["application"]["root_dir"]          = "/var/www/sh-middleman"

# MySQL access settings
default["application"]["mysql"]["host"]     = "localhost"
default["application"]["mysql"]["user"]     = "root"
default["application"]["mysql"]["database"] = "sh_middleman"

# Process name
default["application"]["process"]["name"]   = "sh-middleman"
default["application"]["app"]["hostname"]   = "localhost"
default["application"]["app"]["ip"]         = "127.0.0.1"
default["application"]["app"]["port"]       = 3000

# Session management
default["application"]["session"]["secret"] = "09h2uijespgo8hsdg"
default["application"]["session"]["maxAge"] = "2592000000"

# Logger settings
default["application"]["logger"]["date_format"] = "YYYY MMM D H:mm:ss"
default["application"]["logger"]["console"] = true
default["application"]["logger"]["syslog"] = true
