# libowski

The Great Libowski is a chat bot that allows you to interact with the [Washington County Cooperative Library](https://wccls.bibliocommons.com/) to find items based on keyword searches and to show which branches have the available items.

## Start Server

1. Clone repo
```
git clone git@github.com:emb417/libowski.git
```
2. Install specific nodejs version
```
nvm install 12.12.0
```
3. Install app
```
npm i
```
4. Start app
```
npm start
```
5. Test app
```
curl http://127.0.0.1:1337/find/wargames to test
```
  * Server creates needed logs dir on start
    * app logs to logs/server.log
  * listens on port 1337
  * uses nodemon to reload with changes in app dir 

# Global modules
* server handles logging and routing
* fetch handles external api requests

# Example API Usage

### Request:
```
curl http://127.0.0.1:1337/find/wargames
```

### Response:
* Returns first 5 results with id, # of in / total items, title - subtitle (format), and branch names where item is available now
```javascript
----S143C2099296----2/5----Wargames (DVD)
Hillsboro Brookwood Library
Tigard Public Library
----S143C609225----4/5----WarGames (DVD)
Beaverton City Library
Beaverton City Library
Cedar Mill Library
Hillsboro Shute Park Library
----S143C2099277----1/2----WarGames (BLURAY)
Hillsboro Brookwood Library
----S143C3526699----1/1----Wargaming - An Introduction (BK)
North Plains Public Library
----S143C2708912----0/1----Frostgrave - Fantasy Wargames in the Frozen City (BK)
```
