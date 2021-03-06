require( 'dotenv' ).config();
const asyncHandler = require( 'express-async-handler' );
const bodyParser = require( 'body-parser' );
const express = require( 'express' );
const fs = require( 'fs' );
const helmet = require( 'helmet' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const fetch = require( './fetch' );
const schedule = require( './schedule' );
const slack = require( './slack' );

// setup log dir and config logger
const log4jscfg = {
  appenders: {
    console: { type: 'console' },
    file: {
      type: 'dateFile',
      filename: 'logs/server.log',
      keepFileExt: true,
      daysToKeep: 3,
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

// schedule automation for alerting
const interval = '0 */15 * * * *';
logger.info( `configuring job via cron ${interval}` );
schedule.job( process.env.JOB_INTERVAL || interval );

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );
app.use( helmet() );
app.use( bodyParser.urlencoded( { extended: false } ) );

// express routes
app.post( '/checkouts', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'ephemeral' } );
  logger.info( 'getting checkouts...' );
  const results = await fetch.accountCheckouts( {} );
  slack.sendCheckoutsInfo( results, req.body.response_url );
} ) );

app.post( '/find', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'ephemeral' } );
  logger.info( `searching by keywords ${req.body.text}...` );
  const results = await fetch.searchByKeywords( req.body.text );
  if ( results.length === 0 ) {
    slack.sendAlert( 'This aggression will not stand.  Try again.', req.body.response_url );
  } else {
    slack.sendItemInfo( results, req.body.response_url );
  }
} ) );

app.post( '/holds', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'ephemeral' } );
  logger.info( 'getting holds...' );
  const { holdItems } = await fetch.accountHolds( {} );
  slack.sendHoldsInfo( holdItems, req.body.response_url );
} ) );

app.post( '/hours', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'ephemeral' } );
  logger.info( 'getting hours...' );
  const results = await fetch.hoursForAll();
  slack.sendHoursInfo( results, req.body.response_url );
} ) );

app.post( '/interact', asyncHandler( async ( req, res ) => {
  res.send( { text: 'The Dude abides...', response_type: 'ephemeral' } );
  logger.info( 'parsing payload...' );
  logger.trace( req.body.payload );
  // eslint-disable-next-line camelcase
  const { actions, response_url } = JSON.parse( req.body.payload );
  let response = 'I don\'t know what you\'re talking about';
  if ( actions[0].action_id === 'request-hold' ) {
    response = await fetch.addHold( { itemId: actions[0].value } );
  } else if ( actions[0].action_id.indexOf( 'activate-hold' ) === 0 ) {
    response = await fetch.activateHold( { holdsId: actions[0].value } );
  } else if ( actions[0].action_id.indexOf( 'cancel-hold' ) === 0 ) {
    const [holdsId, itemId] = actions[0].value.split( ' ' );
    response = await fetch.cancelHold( { holdsId, itemId } );
  } else if ( actions[0].action_id.indexOf( 'renew-' ) === 0 ) {
    const checkoutId = actions[0].value;
    response = await fetch.renewCheckout( { checkoutId } );
  }
  slack.sendAlert( `Hey, look, man...${response}`, response_url );
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

app.listen( ( process.env.PORT || 1337 ), logger.info( 'Let\'s bowl...' ) );
