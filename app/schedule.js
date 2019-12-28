const { CronJob } = require( 'cron' );
const log4js = require( 'log4js' );

const archive = require( './archive' );
const capture = require( './capture' );
const fetch = require( './fetch' );
const query = require( './query' );
const slack = require( './slack' );
const utils = require( './utils' );

const logger = log4js.getLogger( 'schedule' );

const job = ( interval ) => new CronJob( interval, async () => {
  logger.info( '********************' );
  const jobId = Date.now();
  logger.info( `${jobId} Job Started...` );
  const { holdItems, holdItemIds } = await fetch.accountHolds( {} );

  logger.info( 'determining hold item status elevations...' );
  await utils.asyncForEach( holdItems, async ( holdItem ) => {
    logger.debug( `${holdItem.metadataId} hold status job...` );
    logger.debug( '...hold item' );
    logger.trace( JSON.stringify( holdItem ) );
    if ( holdItem.status !== 'NOT_YET_AVAILABLE' ) {
      const alertItem = await query.holdStatus( holdItem.holdsId );
      logger.debug( '...alert item from db' );
      logger.trace( JSON.stringify( alertItem[0] ) );
      let holdPositionStatus = 'Ready For Pickup';
      if ( Object.entries( alertItem ).length === 0 ) {
        logger.info( 'sending alert for elevated hold position...' );
        if ( holdItem.status === 'IN_TRANSIT' ) { holdPositionStatus = 'In Transit'; }
        await capture.holdStatus( holdItem );
        slack.sendAlert( `${holdItem.bibTitle} is ${holdPositionStatus}` );
      } else if ( alertItem[0].status === 'IN_TRANSIT' && holdItem.status === 'READY_FOR_PICKUP' ) {
        logger.info( 'sending alert for elevated hold position...' );
        await capture.holdStatus( holdItem );
        slack.sendAlert( `${holdItem.bibTitle} is ${holdPositionStatus}` );
      }
    }
  } );

  logger.info( 'determining non-holdable avail alerts...' );
  await utils.asyncForEach( holdItemIds, async ( itemId ) => {
    logger.debug( `${itemId} avail alert job...` );
    logger.debug( 'capturing avail...' );
    await capture.avail( itemId );
    logger.debug( 'query and compare avail...' );
    const availMessage = await query.avail( itemId );
    if ( availMessage !== 'No Alert' ) {
      logger.info( 'alert...' );
      slack.sendAlert( availMessage );
    }
  } );

  logger.info( 'determining items to archive...' );
  const numOfArchivedItems = await archive.itemsNotInList( holdItemIds );
  if ( numOfArchivedItems > 0 ) { logger.info( `...${numOfArchivedItems} items archived` ); }
  logger.info( `${jobId} Job Completed in ${( Date.now() - jobId ) / 1000} seconds` );
  logger.info( '********************' );
} ).start();

module.exports = { job };
