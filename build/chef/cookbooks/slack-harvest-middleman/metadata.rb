name             "slack-harvest-middleman"
maintainer       "Maciej Garycki"
maintainer_email "maciej@neverbland.com"
description      "Slack - Harvest integration middleman speciffic cookbook"
version          "1.0.0"

recipe           "slack-harvest-middleman", "Install and configure any custom, not generic stuff for Slack - Harvest integration middleman dev env"
recipe           "slack-harvest-middleman::database", "Setup application database"

depends "nodejs"
depends "nginx"