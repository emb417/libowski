const log4js = require( 'log4js' );
const path = require( 'path' );
const Datastore = require( 'nedb-promises' );

const logger = log4js.getLogger( 'archive' );

const itemsNotInList = async ( list ) => {
  try {
    logger.debug( `archiving records for items not in ${list}...` );
    const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
    const numRemoved = await db.remove( { itemId: { $nin: list } }, { multi: true } );
    return numRemoved;
  } catch ( err ) { logger.error( err ); return err; }
};

module.exports = { itemsNotInList };
