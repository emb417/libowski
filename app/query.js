const Datastore = require( 'nedb-promises' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const logger = log4js.getLogger( 'query' );

const compareAvail = ( availEvents ) => {
  logger.debug( '...compareAvail' );
  logger.trace( JSON.stringify( availEvents ) );
  let availableAtBranchNames = [];
  let goneAtBranchNames = [];
  if ( availEvents.length > 0 ) {
    // might be new avail
    availableAtBranchNames = [...availEvents[0].branchNames];
    logger.debug( 'initial availableAtBranchNames...' );
    logger.trace( availableAtBranchNames );
  }
  if ( availEvents.length > 1 ) {
    goneAtBranchNames = [...availEvents[1].branchNames];
    logger.debug( 'initial goneAtBranchNames...' );
    logger.trace( goneAtBranchNames );
    // might be gone
    availEvents[0].branchNames.forEach( ( recentBranchName ) => {
      const indexOfRecentBranch = goneAtBranchNames.findIndex(
        ( priorBranchName ) => priorBranchName === recentBranchName,
      );
      if ( indexOfRecentBranch > -1 ) { goneAtBranchNames.splice( indexOfRecentBranch, 1 ); }
    } );
    // might be avail
    availEvents[1].branchNames.forEach( ( priorBranchName ) => {
      const indexOfPriorBranch = availableAtBranchNames.findIndex(
        ( recentBranchName ) => recentBranchName === priorBranchName,
      );
      if ( indexOfPriorBranch > -1 ) {
        availableAtBranchNames.splice( indexOfPriorBranch, 1 );
      }
    } );
  }
  logger.debug( 'final availableAtBranchNames...' );
  logger.trace( availableAtBranchNames );
  logger.debug( 'final goneAtBranchNames...' );
  logger.trace( goneAtBranchNames );
  return { availableAtBranchNames, goneAtBranchNames };
};

const avail = async ( itemId ) => {
  logger.debug( `avail for ${itemId}...` );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
  const availEvents = await db.find( { itemId, eventType: 'avail' } ).sort( {
    timestamp: -1,
  } ).limit( 2 );
  logger.debug( 'availEvents...' );
  logger.trace( JSON.stringify( availEvents, null, 2 ) );
  const title = `${availEvents[0].title}${availEvents[0].subtitle
    ? ` - ${availEvents[0].subtitle}` : ''} (${availEvents[0].format})`;

  const { availableAtBranchNames, goneAtBranchNames } = compareAvail( availEvents );
  if ( availableAtBranchNames.length > 0 && goneAtBranchNames.length > 0 ) {
    return `${title} is @ ${availableAtBranchNames} and GONE @ ${goneAtBranchNames}`;
  }
  if ( goneAtBranchNames.length > 0 ) {
    return `${title} is GONE @ ${goneAtBranchNames}`;
  }
  if ( availableAtBranchNames.length > 0 ) {
    return `${title} is @ ${availableAtBranchNames}`;
  }
  // send if no avail events
  return 'No Alert';
};

const holdStatus = async ( holdId ) => {
  logger.debug( `status for ${holdId}...` );
  const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );
  const holdItemStatus = await db.find( { holdId, eventType: 'hold-status' } );
  logger.debug( 'holdItemStatus...' );
  logger.trace( JSON.stringify( holdItemStatus ) );
  return holdItemStatus;
};

module.exports = { avail, compareAvail, holdStatus };
