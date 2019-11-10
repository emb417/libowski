const path = require( 'path' );
const Datastore = require( 'nedb-promises' );
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'query' );

const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );

// augment to compare results and return alerts on deltas
const avail = async ( id ) => {
  logger.debug( `avail for ${id}...` );
  db.load();
  const results = await db.find( { id }, {
    timestamp: 1,
    id: 1,
    title: 1,
    format: 1,
    publicationDate: 1,
    branchNames: 1,
    _id: 0,
  } ).sort( {
    timestamp: -1,
  } ).limit( 2 );
  logger.trace( 'avail results', JSON.stringify( results, null, 2 ) );
  if ( results[0].branchNames.length !== results[1].branchNames.length ) {
    return results[0].branchNames.length > results[1].branchNames.length ? 'In' : 'Out';
  }
  return 'No Alert';
};

module.exports = { avail };
