const fs = require( 'fs' );
const path = require( 'path' );
const asyncHandler = require( 'express-async-handler' );
const express = require( 'express' );
const log4js = require( 'log4js' );
const Datastore = require( 'nedb' );
const { search, notHoldableAvailability } = require( './fetch' );
const capture = require( './capture' );

// setup logger files and config
log4js.configure( {
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
} );
const logger = log4js.getLogger( 'Libowski' );
const logDirectory = path.join( __dirname, '..', 'logs' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( logDirectory ) || fs.mkdirSync( logDirectory );

// setup datastore files and config
const dataDirectory = path.join( __dirname, '..', 'data' );
// eslint-disable-next-line no-unused-expressions
fs.existsSync( dataDirectory ) || fs.mkdirSync( dataDirectory );
const db = new Datastore( { filename: path.join( dataDirectory, 'libowski.db' ) } );

// instantiate express app
const app = express();

// express middleware
app.use( log4js.connectLogger( logger ) );

// express routes
app.get( '/find/:keywords', asyncHandler( async ( req, res ) => {
  logger.info( `searching for keywords ${req.params.keywords}...` );
  const results = await search( req.params.keywords );
  res.send( results );
} ) );

app.get( '/now/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( `getting availability for itemId ${req.params.itemId}...` );
  const results = await notHoldableAvailability( req.params.itemId );
  res.send( results );
} ) );

app.get( '/insert/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( `adding alert for itemId ${req.params.itemId}...` );
  const results = await capture( req.params.itemId );
  res.send( results );
} ) );

app.get( '/avail/:itemId', asyncHandler( async ( req, res ) => {
  logger.info( 'getting alerts...' );
  db.loadDatabase();
  db.find( { id: req.params.itemId }, {
    timestamp: 1,
    id: 1,
    title: 1,
    format: 1,
    publicationDate: 1,
    branchNames: 1,
    _id: 0,
  } ).sort( {
    timestamp: -1,
  } ).limit( 2 ).exec( ( err, docs ) => {
    if ( err ) { logger.error( err ); return err; }
    logger.debug( 'found docs...' );
    res.send( JSON.stringify( docs, null, 2 ) );
    return res;
  } );
} ) );

app.get( '*', ( req, res ) => { res.send( 'The Dude does not abide!' ); } );

app.listen( 1337, logger.info( 'server started' ) );
