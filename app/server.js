require( 'dotenv' ).config();
const { CronJob } = require( 'cron' );
const asyncHandler = require( 'express-async-handler' );
const bodyParser = require( 'body-parser' );
const express = require( 'express' );
const fs = require( 'fs' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const archive = require( './archive' );
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
    default: { appenders: ['file', 'console'], level: 'info' },
  },
};
log4js.configure( log4jscfg );
const logger = log4js.getLogger( 'Libowski' );
logger.info( 'Call me "The Dude."' );
logger.debug( 'Or his Dudeness' );
logger.trace( 'Or duder, or El Duderino, if you\'re not into the whole brevity thing.' );
const logDirectory = path.join( __dirname, '..', 'logs' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( logDirectory ) || fs.mkdirSync( logDirectory );
logger.info( 'logs directory in place...' );

// setup data dir
const dataDirectory = path.join( __dirname, '..', 'data' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( dataDirectory ) || fs.mkdirSync( dataDirectory );
logger.info( 'data directory in place...' );

const interval = process.env.NODE_ENV ? '0 */15 8-20 * * *' : '*/30 * * * * *';
logger.info( `getting non holdable avail via cron ${interval}` );
// get non holdable avail
const job = new CronJob( interval, async () => {
  const { holdItemIds } = await fetch.accountHolds( {} );
  logger.debug( `...alert ids ${holdItemIds}` );
  await utils.asyncForEach( holdItemIds, async ( itemId ) => {
    logger.info( `capturing avail for alert id ${itemId}...` );
    await capture.avail( itemId );
    logger.info( 'query avail...' );
    const availMessage = await query.avail( itemId );
    if ( availMessage !== 'No Alert' ) {
      logger.info( 'alert...' );
      slack.sendAlert( `${itemId} - ${availMessage}` );
      smtp.sendMessage( `${itemId} - ${availMessage}` );
    }
  } );
  const archivedResponse = await archive.itemsNotInList( holdItemIds );
  logger.info( archivedResponse );
} );

job.start();

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );

app.use( bodyParser.urlencoded( { extended: false } ) );

// express routes
app.post( '/find', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'in_channel' } );
  logger.info( `searching by keywords ${req.body.text}...` );
  const results = await fetch.searchByKeywords( req.body.text );
  if ( results.length === 0 ) {
    slack.sendAlert( 'This aggression will not stand.  Try again.', req.body.response_url );
  } else {
    slack.sendItemInfo( results, req.body.response_url );
  }
} ) );

app.post( '/interact', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'in_channel' } );
  logger.info( 'parsing payload...' );
  logger.trace( req.body.payload );
  // eslint-disable-next-line camelcase
  const { actions, response_url } = JSON.parse( req.body.payload );
  let response = 'I don\'t know what you\'re talking about';
  if ( actions[0].action_id === 'request-hold' ) {
    response = await fetch.addHold( { itemId: actions[0].value } );
  } else if ( actions[0].action_id === 'cancel-hold' ) {
    const [holdsId, itemId] = actions[0].value.split( ' ' );
    response = await fetch.cancelHold( { holdsId, itemId } );
  }
  slack.sendAlert( `Hey, look, man...${response}`, response_url );
} ) );

app.post( '/now', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'in_channel' } );
  logger.info( `fetching info for itemId ${req.body.text}...` );
  const result = await fetch.infoById( req.body.text );
  slack.sendItemInfo( [result], req.body.response_url );
} ) );

app.get( '/oauth', asyncHandler( async ( req, res ) => {
  if ( !req.query.code ) {
    res.status( 500 );
    res.send( { Error: 'I need a code, man.' } );
    logger.info( 'slack oauth no code...' );
  } else {
    logger.info( `slack oauth ${req.query.code}...` );
    const response = await slack.oauth( req.query.code );
    res.send( response );
  }
} ) );

app.get( '*', ( req, res ) => { res.send( 'The Dude does not abide!' ); } );

app.listen( ( process.env.PORT || 1337 ), logger.info( 'server started...' ) );
