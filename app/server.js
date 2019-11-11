const fs = require( 'fs' );
const path = require( 'path' );
const asyncHandler = require( 'express-async-handler' );
const express = require( 'express' );
const log4js = require( 'log4js' );
const log4jscfg = require( './log4jscfg' );
const fetch = require( './fetch' );
const capture = require( './capture' );
const query = require( './query' );
const utils = require( './utils' );

// setup logger files and config
log4js.configure( log4jscfg );
const logger = log4js.getLogger( 'Libowski' );
logger.info( 'Call me "The Dude."' );
const logDirectory = path.join( __dirname, '..', 'logs' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( logDirectory ) || fs.mkdirSync( logDirectory );
logger.info( 'logs directory in place...' );

// setup datastore files and config
const dataDirectory = path.join( __dirname, '..', 'data' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( dataDirectory ) || fs.mkdirSync( dataDirectory );
logger.info( 'data directory in place...' );

// get non holdable avail
setInterval( async () => {
  const alertIds = ['S143C3658715', 'S143C3653511', 'S143C3646473', 'S143C3643101', 'S143C3640864'];
  const alertMessages = [];
  await utils.asyncForEach( alertIds, ( alertId ) => {
    logger.info( `capturing alert id ${alertId}...` );
    alertMessages.push( capture.avail( alertId ) );
  } );
  logger.info( 'sending messages...' );
  await utils.asyncForEach( alertMessages, ( message ) => {
    logger.trace( `send message...\n${message}` );
  } );
}, 900000 );

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );

// express routes
app.get( '/find/:keywords', asyncHandler( async ( req, res ) => {
  logger.info( `searching for keywords ${req.params.keywords}...` );
  const results = await fetch.search( req.params.keywords );
  res.send( results );
} ) );

app.get( '/now/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( `fetching availability for itemId ${req.params.itemId}...` );
  const results = await fetch.notHoldableAvailability( req.params.itemId );
  res.send( results );
} ) );

app.get( '/insert/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( `inserting avail for itemId ${req.params.itemId}...` );
  const results = await capture.avail( req.params.itemId );
  res.send( results );
} ) );

app.get( '/avail/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( 'querying avail...' );
  const results = await query.avail( req.params.itemId );
  res.send( `...find avail for ${req.params.itemId}\n${JSON.stringify( results, null, 2 )}\n` );
} ) );

app.get( '*', ( req, res ) => { res.send( 'The Dude does not abide!' ); } );

app.listen( 1337, logger.info( 'server started...' ) );
