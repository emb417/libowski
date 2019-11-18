# libowski

The Great Libowski is an aspiring chat bot that allows you to interact with the [Washington County Cooperative Library](https://wccls.bibliocommons.com/) to find items based on keyword searches and to show which branches have the available items.

## Setup Server
libowski can run as a stand alone express app or it can be used by an installed slack app, in either case dotenv is used for ids and secrets supporting sending both [smtp via gmail](https://github.com/emb417/libowski/blob/master/app/smtp.js) or [slacks](https://github.com/emb417/libowski/blob/master/app/slack.js).

1. dotenv for smtp via gmail
```
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
SCOPE=https://mail.google.com/
REDIRECT_URL=https://developers.google.com/oauthplayground
USER_EMAIL=
USER_NAME=
SMTP_ADDRESSES=
```
2. dotenv for slack
```
SLACK_WEBHOOK_URL=
SLACK_OAUTH_ACCESS_TOKEN=
SLACK_APP_ID=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_SIGNING_SECRET=
```
3. Start app with alerts scheduled every 15 seconds
```
npm start
```
4. OR start app in prod mode with alerts every 15 minutes
```
npm run start-prod
```

  * Server creates needed dirs on start
    * app logs to logs/server.log
    * data saves to data/libowski.db
  * http listens on port 1337
  * uses nodemon to reload with changes in app dir 

## App modules
### server
* logging, scheduling alerts, and routing gets/posts
### fetch
* external api requests to wccls
### query
* nedb finds for alerts
### capture
* nedb inserts for alerts and availability changes
### slack
* formatting blocks
### smtp
* sends emails via gmail

## Tests
Always needs improvement...