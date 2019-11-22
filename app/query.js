const path = require( 'path' );
const Datastore = require( 'nedb-promises' );
const log4js = require( 'log4js' );
const _ = require( 'lodash' );

const logger = log4js.getLogger( 'query' );

const alerts = async () => {
  logger.debug( 'get all alerts...' );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
  const results = await db.find( { eventType: 'alert' } );
  logger.trace( `...results ${JSON.stringify( results )}` );
  return results.map( ( item ) => item.itemId );
};

const avail = async ( itemId ) => {
  logger.debug( `avail for ${itemId}...` );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
  const results = await db.find( { itemId, eventType: 'avail' } ).sort( {
    timestamp: -1,
  } ).limit( 2 );
  logger.trace( `avail results...\n${JSON.stringify( results, null, 2 )}` );
  logger.debug( 'availMessage...' );
  const title = `${results[0].title}${results[0].subtitle
    ? ` - ${results[0].subtitle}` : ''} (${results[0].format})`;
  if ( results.length > 1
    && results[0].branchNames.length !== results[1].branchNames.length ) {
    return results[0].branchNames.length > results[1].branchNames.length
      ? `${title} is @ ${_.difference( results[0].branchNames, results[1].branchNames )}`
      : `${title} is GONE @ ${_.difference( results[1].branchNames, results[0].branchNames )}`;
  }
  if ( results.length > 1
    && results[0].branchNames.length > 0
    && results[0].branchNames.length === results[1].branchNames.length
    && ( _.difference( results[0].branchNames, results[1].branchNames ) !== []
    && _.difference( results[1].branchNames, results[0].branchNames ) !== [] ) ) {
    return `${title} is @ ${_.difference( results[0].branchNames, results[1].branchNames )} and is GONE @ ${_.difference( results[1].branchNames, results[0].branchNames )}`;
  }
  if ( results.length === 1
    && results[0].branchNames.length > 0 ) {
    return `${title} is @ ${results[0].branchNames}`;
  }
  return 'No Alert';
};

module.exports = { avail, alerts };
