# libowski

The Great Libowski is a chat bot that allows you to interact with the [Washington County Cooperative Library](https://wccls.bibliocommons.com/) to find items based on keyword searches and to show which branches have the available items.

## Start Server

1. git clone git@github.com:emb417/libowski.git
1. nvm install 12.12.0
1. npm i -g yarn
1. yarn
1. yarn start
  * Server creates needed logs dir on start
    * app logs to logs/server.log
  * listens on port 1337
  * uses nodemon to reload with changes in app dir 
1. curl http://127.0.0.1:1337/find/wargames to test

## Automation Setup
Automation files are included for Mac OS X.
* com.wccls.News.plist (global LaunchAgent) curls the server at /news every 15 from 9-8 (open hours)
* CurlOnDemand.applescript will listen for incoming messages and curl the message text as the path to the local server (read: chat bot)

To setup plists, try LaunchControl for nice GUI experience, or show your 1337 skillz with cp and launchctl:
* sudo cp com.wccls.News.plist /Library/LaunchAgents/.
* launchctl load /Library/LaunchAgents/com.wccls.News.plist

Included is a shell script that interacts with messages on a mac:
* imessage.sh is called by an index.js child_process
  * NOTE: make sure this script is executable (hint: chmod)

# Global modules
* server handles logging and routing
* utils handles string cleanup

# App Modules
The app dir is divided into modules, each including:
* a route in server.js
* a named dir, e.g. news
* an index.js containing the express app
* a config.json for default values
* a scraper that "crawls" the site
* a parser that uses cheerio to pull data out of the html

## News Module
  
### Config Setup
* Modify config.json 
  * branchIds with the ones you frequent
  * msgTo with your messages email address (or phone number)
  * keywords with the titles you're interested in
    * NOTE: keywords that redirect to a single item will not work

# Example API Usage

### Request:
* curl http://127.0.0.1:1337/find/wargames

#### AC (Availability Code Filters)
* In
* In -- Not Holdable
* Held
* Out (does't work yet because of due date dynamics)
* Lost
* Missing
* Transferred
* In-Transit
* On-Order
* In-Repair
* Unavailable

### Response:
```javascript
----S143C2099296----2/5----Wargames(DVD)
----S143C609225----4/5----WarGames(DVD)
----S143C2099277----1/2----WarGames(BLURAY)
----S143C3526699----1/1----Wargaming(BK)
----S143C2708912----0/1----Frostgrave(BK)
----S143C3481659----1/1----Bolt Action(BK)
----S143C2663507----1/1----Zones of Control(BK)
----S143C3495133----0/3----Call of Duty: Black Ops IIII(VIDEO_GAME)
----S143C3591796----1/2----Bomber Crew(VIDEO_GAME)
----S143C3591795----0/1----Bomber Crew(VIDEO_GAME)
----S143C3563724----0/1----Assassin's Creed III(VIDEO_GAME)
----S143C3563690----0/1----Darksiders(VIDEO_GAME)
----S143C1751354----1/1----Crossing the Rubicon(BK)
----S143C3005005----1/1----Doctor Who Classics Omnibus(GRAPHIC_NOVEL)
```
