require( 'dotenv' ).config();
const { CronJob } = require( 'cron' );
const asyncHandler = require( 'express-async-handler' );
const bodyParser = require( 'body-parser' );
const express = require( 'express' );
const fs = require( 'fs' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const capture = require( './capture' );
const fetch = require( './fetch' );
const query = require( './query' );
const slack = require( './slack' );
const smtp = require( './smtp' );
const utils = require( './utils' );

// setup log dir and config logger
const log4jscfg = {
  appenders: {
    console: { type: 'console' },
    file: {
      type: 'file',
      filename: 'logs/server.log',
      maxLogSize: 10485760,
      backups: 2,
      compress: true,
    },
  },
  categories: {
    default: { appenders: ['file', 'console'], level: 'trace' },
  },
};
log4js.configure( log4jscfg );
const logger = log4js.getLogger( 'Libowski' );
logger.info( 'Call me "The Dude."' );
const logDirectory = path.join( __dirname, '..', 'logs' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( logDirectory ) || fs.mkdirSync( logDirectory );
logger.info( 'logs directory in place...' );

// setup data dir
const dataDirectory = path.join( __dirname, '..', 'data' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( dataDirectory ) || fs.mkdirSync( dataDirectory );
logger.info( 'data directory in place...' );

const interval = process.env.NODE_ENV ? '0 */15 8-20 * * *' : '*/15 * * * * *';
logger.info( `getting non holdable avail via cron ${interval}` );
// get non holdable avail
const job = new CronJob( interval, async () => {
  const alertIds = await query.alerts();
  logger.debug( `...alert ids ${alertIds}` );
  await utils.asyncForEach( alertIds, async ( alertId ) => {
    logger.info( `capturing alert id ${alertId}...` );
    await capture.avail( alertId );
    logger.info( 'query avail...' );
    const availMessage = await query.avail( alertId );
    if ( availMessage !== 'No Alert' ) {
      logger.info( 'alert...' );
      slack.postMessage( `${alertId} - ${availMessage}` );
      smtp.sendMessage( `${alertId} - ${availMessage}` );
    }
  } );
} );

job.start();

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );

app.use( bodyParser.urlencoded( { extended: false } ) );

// express routes
app.post( '/alert/activate', asyncHandler( async ( req, res ) => {
  logger.info( 'activating alert...' );
  const response = await capture.alertStatus( req.body.text, true );
  res.send( response );
} ) );

app.post( '/alert/deactivate', asyncHandler( async ( req, res ) => {
  logger.info( 'deactivating alert...' );
  const response = await capture.alertStatus( req.body.text, false );
  res.send( response );
} ) );

app.get( '/alert/activate/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( 'activating alert...' );
  const response = await capture.alertStatus( req.params.itemId, true );
  res.send( response );
} ) );

app.get( '/alert/deactivate/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( 'deactivating alert...' );
  const response = await capture.alertStatus( req.params.itemId, false );
  res.send( response );
} ) );

app.get( '/avail/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( 'querying avail...' );
  const results = await query.avail( req.params.itemId );
  res.send( `...find avail for ${req.params.itemId}\n${JSON.stringify( results, null, 2 )}\n` );
} ) );

app.get( '/find/:keywords', asyncHandler( async ( req, res ) => {
  logger.info( `searching for keywords ${req.params.keywords}...` );
  const results = await fetch.search( req.params.keywords );
  res.send( results );
} ) );

app.get( '/insert/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( `inserting avail for itemId ${req.params.itemId}...` );
  const results = await capture.avail( req.params.itemId );
  res.send( results );
} ) );

app.get( '/now/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( `fetching availability for itemId ${req.params.itemId}...` );
  const results = await fetch.notHoldableAvailability( req.params.itemId );
  res.send( results );
} ) );

app.get( '/oauth', asyncHandler( async ( req, res ) => {
  if ( !req.query.code ) {
    res.status( 500 );
    res.send( { Error: 'I need a code, man.' } );
    logger.info( 'slack oauth no code...' );
  } else {
    logger.info( `slack oauth ${req.query.code}...` );
    const response = await fetch.slackOauth( req.query.code );
    res.send( response );
  }
} ) );

app.get( '*', ( req, res ) => { res.send( 'The Dude does not abide!' ); } );

app.listen( ( process.env.PORT || 1337 ), logger.info( 'server started...' ) );
