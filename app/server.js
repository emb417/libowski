const fs = require('fs');
const path = require('path');
const express = require('express');
const log4js = require('log4js');
log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs/server.log' }
  },
  categories: {
    default: { appenders: ['file','console'], level: 'debug' }
  }
});
const logger = log4js.getLogger();
const logDirectory = path.join(__dirname, '..', 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// app modules
const find = require('./find');
const now = require('./now');

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );

// express routes
app.get( '/find/:keywords', find );
app.get( '/now/:itemId', now );
app.get( '*', ( req, res ) => { res.send( `The Dude does not abide!` ); } );

app.listen( 1337, logger.info( 'server started' ) );
