const log4js = require( 'log4js' );
const path = require( 'path' );
const Datastore = require( 'nedb-promises' );

const logger = log4js.getLogger( 'archive' );

const itemsById = async ( itemId ) => {
  try {
    logger.debug( `archiving records for itemId ${itemId}...` );
    const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
    const numRemoved = await db.remove( { itemId }, { multi: true } );
    return `...archived ${numRemoved} records for ${itemId}\n`;
  } catch ( err ) { logger.error( err ); return err; }
};

module.exports = { itemsById };
