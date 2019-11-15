const path = require( 'path' );
const Datastore = require( 'nedb-promises' );
const log4js = require( 'log4js' );
const _ = require( 'lodash' );

const logger = log4js.getLogger( 'query' );

const avail = async ( id ) => {
  logger.debug( `avail for ${id}...` );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
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
  logger.trace( `avail results...\n${JSON.stringify( results, null, 2 )}` );
  logger.debug( 'availMessage...' );
  const title = `${results[0].title}${results[0].subtitle
    ? ` - ${results[0].subtitle}` : ''} (${results[0].format})`;
  if ( results.length > 1 && results[0].branchNames.length !== results[1].branchNames.length ) {
    return results[0].branchNames.length > results[1].branchNames.length
      ? `${title} is @ ${_.difference( results[0].branchNames, results[1].branchNames )}`
      : `${title} is GONE @ ${_.difference( results[1].branchNames, results[0].branchNames )}`;
  }
  if ( results.length === 1 && results[0].branchNames.length > 0 ) {
    return `${title} is @ ${results[0].branchNames}`;
  }
  return 'No Alert';
};

module.exports = { avail };
