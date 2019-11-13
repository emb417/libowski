const fs = require( 'fs' );
const path = require( 'path' );
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'utils' );

const asyncForEach = async ( array, callback ) => {
  for ( let index = 0; index < array.length; index += 1 ) {
    await callback( array[index], index, array ); // eslint-disable-line no-await-in-loop
  }
};

const logSetup = () => {
  const logDirectory = path.join( __dirname, '..', 'logs' );
  // eslint-disable-next-line no-unused-expressions
  fs.existsSync( logDirectory ) || fs.mkdirSync( logDirectory );
  logger.info( 'logs directory in place...' );
};

const datastoreSetup = () => {
  const dataDirectory = path.join( __dirname, '..', 'data' );
  // eslint-disable-next-line no-unused-expressions
  fs.existsSync( dataDirectory ) || fs.mkdirSync( dataDirectory );
  logger.info( 'data directory in place...' );
};

module.exports = { asyncForEach, logSetup, datastoreSetup };
