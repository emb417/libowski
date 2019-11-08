const log4js = require( 'log4js' );
const path = require( 'path' );
const Datastore = require( 'nedb' );

const logger = log4js.getLogger( 'query' );

const avail = async ( id ) => {
  const db = new Datastore( { filename: path.join( __dirname, '..', 'data', 'libowski.db' ), autoload: true } );
  db.find( { id }, {
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
    logger.debug( 'found docs...\n', docs );
    return docs;
  } );
};

module.exports = { avail };
