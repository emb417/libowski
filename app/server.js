const fs = require('fs');
const path = require('path');
const express = require('express');
const log4js = require('log4js');
const { search, notHoldableAvailability } = require('./fetch');

log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: {
      type: 'file',
      filename: 'logs/server.log',
      maxLogSize: 10485760,
      backups: 2,
      compress: true
    }
  },
  categories: {
    default: { appenders: ['file','console'], level: 'info' }
  }
});
const logger = log4js.getLogger('Libowski');
const logDirectory = path.join(__dirname, '..', 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );

// express routes
app.get( '/find/:keywords', async ( req, res ) => {

  logger.info( `searching for keywords ${ req.params.keywords }...` );

  try {
    const results = await search( req.params.keywords );
    res.send( results );
  } catch ( err ) { res.send( err ); }
  
} );

app.get( '/now/:itemId', async ( req, res ) => {

  logger.info( `getting availability for itemId ${ req.params.itemId }...` );

  try {
    const results = await notHoldableAvailability( req.params.itemId );
    res.send( results );
  } catch ( err ) { res.send( err ); }

} );

app.get( '*', ( req, res ) => { res.send( `The Dude does not abide!` ); } );

app.listen( 1337, logger.info( 'server started' ) );
