# libowski

The Great Libowski is a slack app using slash commands and webhooks to interact with the [Washington County Cooperative Library](https://wccls.bibliocommons.com/) system.  The most important feature of libowski is alerting you when non-holdable items are available for checkout at a branch of interest AND when items in your hold list have changed status, e.g. Wargames is In Transit OR Wargames is Ready For Pickup.

Libowski can also help you:

1. find items based on keyword searches (/libfind <keyword>)
1. place holds (interactive button)
1. cancel holds (interactive button)
1. get a list of holds with position in line (/libholds)
1. get a list of checked out items with due dates (/libcheckouts)

## Setup Server
Libowski is a nodejs app using axios to fetch data from WCCL and express to handle interactive slack components.  Dotenv is used for ids and secrets, currently supporting [slack](https://github.com/emb417/libowski/blob/master/app/slack.js) and configured to support [smtp via gmail](https://github.com/emb417/libowski/blob/master/app/smtp.js) with an additional line of code needed.

1. dotenv for library creds
```
LIBRARY_NAME=<barcode>
LIBRARY_PIN=<pin>
HOLD_BRANCH_DEFAULT=<branchid>
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
3. dotenv for smtp via gmail
```
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
SCOPE=https://mail.google.com/
REDIRECT_URL=https://developers.google.com/oauthplayground
USER_EMAIL=<sender email>
USER_NAME=<sender name>
SMTP_ADDRESSES=<receiver emails comma separated>
```
4. Start app with alerts scheduled every 30 seconds
```
npm start
```
5. OR start app in prod mode with alerts every 15 minutes
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
* logging, file setup, schedule setup, and routing gets/posts
### schedule
* running scheduled jobs for hold status updates and avail alerts
### fetch
* external api requests to wccls
### query
* queries nedb for past records and compares for alerting
### capture
* inserts into nedb for hold status and availability changes
### archive
* removes from nedb for old items not in holds list
### slack
* formatting blocks, basic alerts, and posting to slack
### smtp
* sends emails via gmail

## Tests
Basic framework with mocha and nyc setup with a few basic tests...needs improvement...