const path = require( 'path' );
const Datastore = require( 'nedb-promises' );
const log4js = require( 'log4js' );
const _ = require( 'lodash' );

const logger = log4js.getLogger( 'query' );

const alerts = async () => {
  logger.debug( 'get all alerts...' );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
  const results = await db.find( { eventType: 'alert' }, {
    timestamp: 1,
    itemId: 1,
    alertActive: 1,
    _id: 0,
  } ).sort( {
    timestamp: 1,
  } );
  logger.trace( `...results ${JSON.stringify( results )}` );
  const uniqueItems = [...new Map( results.map( ( row ) => [row.itemId, row] ) ).values()];
  logger.trace( `...uniqueItems ${JSON.stringify( uniqueItems )}` );
  return uniqueItems.filter( ( item ) => item.alertActive ).map( ( item ) => item.itemId );
};

const avail = async ( itemId ) => {
  logger.debug( `avail for ${itemId}...` );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
  const results = await db.find( { itemId, eventType: 'avail' }, {
    timestamp: 1,
    itemId: 1,
    branchNames: 1,
    title: 1,
    subtitle: 1,
    format: 1,
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

module.exports = { avail, alerts };
