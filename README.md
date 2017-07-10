![Travis CI](https://travis-ci.org/Neverbland/slack-harvest.svg)

### :warning: We are looking for maintainers!
This plugin is not currently being maintained, so if you're interested, send us an email at hello@neverbland.com.

# Slack - Harvest integration

The project aims to create a standalone application for automated integration between Harvest time tracking tool and Slack messaging system that will notify all configured team users about the amount of time they've spent on each project according to their Harvest timesheet.

## Setup

To download the application, check it out with `git`. Next thing to do is installing all dependencies with the `npm` node packages manager tool.

```bash
$ cd /path/to/project
$ npm install
```

Next thing to do is preparing the **config file**. The file must be located in the repository root and named `config.json` A template file is stored in `config.dist.json`. The file is divided into sections containing particular configuration options for the application middlewares. To get the Slack <-> Harvest part communicate, the most important thing is to set up the credentials for both services properly.

## Architecture

The application is written 100% in `Node.JS` and at this point consists of three blocks:
- the **cron-like time schedule** that sends notification messages to slack users,
- a simple **HTTP API** to trigger notifications (single user and all users notifications, management report),
- a **Slack Command API endpoint** that manages Harvest timer setup.


###HARVEST configuration

For the moment, harvest communication may be only set up using an account. To have a complete list of projects in all user notifications, an account with access to prefferably all available projects, users and clients should be used. Mandatory parameters in the configuration object are `subdomain`, `email` and `password`.

```
"harvest": {
    "subdomain": "example_harvest_domain",
    "email": "XXXXX@neverbland.com",
    "password": "XXXXXXXXXXXXXXX"
}
```

###SLACK configuration

The Slack part uses a simple **incoming WebHook** that needs to be created within the Slack application itself (See [https://api.slack.com/incoming-webhooks](https://api.slack.com/incoming-webhooks)). The only mandatory parameter that need to be set is `endpoint` which is the webhook endpoint. The configuration below contains additional params which are overriding the default settings for the webhook. All [params available for the webhook](https://api.slack.com/incoming-webhooks) can be used except `channel`, which will always be overridden by **slack username** of the user that receives the notifications.

```
"slack": {
    "username": "Harvest",
    "icon_url": "https://avatars0.githubusercontent.com/u/43635?v=3&s=200",
    "endpoint": "XXXXXXXXXXXXXX"
}
```

### Users configuration

The users section contains the mapping of all available users **Harvest ID -> Slack username** map. Only these users will be available for notification.

```
"users": {
    "123456": "slack_name"
}
```


##CRON

For the moment the application is able to:

- notify defined users at the configured time every work day (monday - friday). The time is defined in the `cron.notify` section of the config file and uses **the same timezone as the machine the app is running on**. For the configuration below, the app will automatically send notifications every working day at `16:30`. If a `cron.notify.cronTime` value is provided in the config, **this value will be used instead of the hour and minutes settings**

-  refresh (preload) the information about timesheet related entries (clients and projects) according to cron time provided in `cron.preload.cronTime` section

-  send periodical report notifications on Slack management channel defined in `cron.report.channel` setting according to cron time provided in `cron.report.cronTime` section

-  send reminder messages via Slack to people who have no timers running according to `cron.remind.cronTime` setting.

```
"cron": {
    "notify": {
        "hour": "16",
        "munutes": "30",
        "cronTime": "00 30 16 * * 1-5" // Optional, instead of hour/minutes
    },
    "preload": {
        "cronTime": "00 00 7-20 * * 1-5"
    },
    "report": {
        "reportTitle": "Weekly activity report",
        "channel": "#channel_name",
        "cronTime": "00 00 20 * * 5"
    }
}
```

If any of the section for `cron` settings are not provided, the cron job will not be set up.


##API

The API provides given endpoints:

- `http|https://your.domain.you/notify-all` Notifies all users present in the users config providing information about their started tasks.

- `http|https://your.domain.you/notify-user/user_id` Notifies user given by `user_id` which represents **either Harvest user ID or Slack username** about her/his started tasks.

- `http|https://your.domain.you/notify-management` Notifies management channel provided in the `channel` property of the `POST` request.

- `http|https://your.domain.you/remind-all` Triggers notifications to users wo have no tasks started on Harvest.

The `notify-all` and `notify-user` are **actions names**; this will be useful when creating authorization token.


###API configuration

The `api.auth` section of the config file contains settings for the authorization parameters. There are two built in methods of authorization:

- **Static token method** - will be used if an `api.auth.token` setting is present. The incoming requests will be checked if they contain a `POST` value with the name `token` and if the value matches the `api.auth.token` value.

- **Dynamic token method** - will be used if an `api.auth.secret` setting is present.  To validate the request and grant access, a `POST` payload must contain a **token** and a **seed**. The token is generated with an `SHA1` hash of the same **secret as provided in the application config file**, **seed** and the **action name** from the URL (see above) joined by **|**.

Example PHP implementation of the token generation:

```php
<?php

$url = "http://some-domain.com/notify-all";
$secret = "thisisthesecret";     // Same secret as in the config file
$seed = generateRandomSeed(10);  // Eg. method that generates random string
$token = sha1(implode("|", array(
	$secret,
    $seed,
    "notify-all"
)));

```


##Harvest timer management

The app provides an endpoint for a **Slack slash command** that enables management of the **Harvest day entries** directly from Slack. The command needs to be configured according to Slack slash command configuration guide [https://api.slack.com/slash-commands](https://api.slack.com/slash-commands). The timer management, in the most advanced case, works as a dialogue between the user (via Slack UI) and the server.

###Command syntax

The command syntax contains the configured slack command name (e.g. `/timer`) and following `action` name. Available actions:

- `status` shows the Harvest client, project and task name for the current user task. This is a single step task that doesn't follow a dialogue with the server.

- `projects` lists out all currently available projects with the client names.

- `stop` stops the work for the task that is currently running for given user. This is a single step task that doesn't follow a dialogue with the server.

- `remind` checks all users timelines and sends slack reminder message to all users who have empty day entries timelines. Accepts one additional parameter, which is the userId (**either slack name or harvest id**).

- `start` aims to start a task. As an additional param, a project/client name can be provided. This will trigger a dialogue with the server that can be stopped at any point.

- `update` allows user to update her/his number of hours for given day entry. As an additional param, a project/client name can be provided. This will trigger a dialogue with the server that can be stopped at any point.

###Examples
Command:
```
/timer status
```
Example output:
```
You are currently working on
NEVERBLAND - Internal - Admin
```


Command:
```
/timer projects
```
Example output:
```
Available projects

1. Test Client - Test Project
2. Test Client - Test Project 2
```



Command:
```
/timer stop
```
Example output:
```
Successfully stopped the timer for
NEVERBLAND - Internal - Admin
```


Command:
```
/timer remind
```
Example output:
```
Notified given users:

some_user1
some_user2
```



Dialogue command 1:
```
/timer start neverb
```
Example dialogue output:
```
Choose the awesome project you are working on today!

1. NEVERBLAND - Project 1
2. NEVERBLAND - Project 2
3. NEVERBLAND - Project 3
4. NEVERBLAND - Project 4

Just type the number to choose it or write 'no' to quit the timer setup
```
Dialogue command 2:
```
/timer 2
```
Example dialogue output:
```
Cool, love that project!

What task are you on?

1. Admin
2. Backend
3. Bug Fixing
4. Design
5. Frontend
6. Support

Just type the number to choose it or write 'no' if you picked the wrong project.
```
Dialogue command 3:
```
/timer 2
```
Example dialogue output:
```
Successfully created and started an entry for
NEVERBLAND - Project 2 - Backend
```


Dialogue command 1:
```
/timer update neverb
```
Example dialogue output:
```
Choose which entry you want to update!

1. NEVERBLAND - Project 1 - Task 1 (02:25)
2. NEVERBLAND - Project 2 - Task 3 (01:30)

Just type the number to choose it or write 'no' to quit the timer setup
```
Dialogue command 2:
```
/timer 2
```
Example dialogue output:
```
Cool, please provide a time to set for
NEVERBLAND - Project 2 - Task 3 (01:30)
Just type /timer followed by a valid time format (HH:mm or number of seconds) or write /timer no to quit the timer setup
```
Dialogue command 3:
```
/timer 02:30
```
Example dialogue output:
```
Successfully updated the time for
NEVERBLAND - Project 2 - Task 3 (01:30)
to 02:30
```
