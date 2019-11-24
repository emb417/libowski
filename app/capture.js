const axios = require( 'axios' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const logger = log4js.getLogger( 'capture' );
const Datastore = require( 'nedb' );

const db = new Datastore( { filename: path.join( __dirname, '..', 'data', 'libowski.db' ), autoload: true } );

const alertStatus = async ( itemId ) => {
  logger.debug( `activating alerts for itemId ${itemId}...` );

  try {
    db.insert( {
      timestamp: Date.now(),
      eventType: 'alert',
      itemId,
    }, ( err, docs ) => {
      if ( err ) { logger.error( err ); return err; }
      logger.debug( 'itemId inserted...' );
      logger.trace( JSON.stringify( docs ) );
      return { docs };
    } );
    return `...activated ${itemId}`;
  } catch ( err ) { logger.error( err ); return err; }
};

const avail = async ( itemId ) => {
  logger.debug( `not holdable availability for itemId ${itemId}...` );

  try {
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );

    logger.debug( 'availability response...' );
    logger.trace( JSON.stringify( data, null, 2 ) );

    const entity = data.entities.bibs[itemId];
    const branchesOfInterest = ['Beaverton City Library', 'Beaverton Murray Scholls Library', 'Tigard Public Library', 'Tualatin Public Library'];
    const branchNames = [];
    data.items.forEach( ( item ) => {
      if ( item.status === 'AVAILABLE_ITEMS' ) {
        item.items.forEach( ( unit ) => {
          logger.debug( 'unit...' );
          logger.trace( JSON.stringify( unit, null, 2 ) );
          if ( branchesOfInterest.includes( unit.branchName )
          && unit.collection.includes( 'Not Holdable' ) ) {
            branchNames.push( unit.branchName );
          }
        } );
      }
    } );

    db.insert( {
      timestamp: Date.now(),
      eventType: 'avail',
      itemId: entity.briefInfo.id,
      branchNames,
      publicationDate: entity.briefInfo.publicationDate,
      title: entity.briefInfo.title,
      subtitle: entity.briefInfo.subtitle,
      format: entity.briefInfo.format,
      description: entity.briefInfo.description,

    }, ( err, docs ) => {
      if ( err ) { logger.error( err ); return err; }
      logger.debug( 'entity inserted...' );
      logger.trace( JSON.stringify( docs ) );
      return { docs };
    } );
    return `...inserted ${entity.briefInfo.title}`;
  } catch ( err ) { logger.error( err ); return err; }
};

module.exports = { avail, alertStatus };
