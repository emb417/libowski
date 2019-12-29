const axios = require( 'axios' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const logger = log4js.getLogger( 'capture' );
const Datastore = require( 'nedb' );

const { branchesOfInterest } = require( './utils' );

const db = new Datastore( { filename: path.join( __dirname, '..', 'data', 'libowski.db' ), autoload: true } );

const holdStatus = async ( item ) => {
  logger.debug( `storing hold item status for ${item.metadataId}...` );
  logger.trace( JSON.stringify( item.metadataId ) );
  try {
    db.insert( {
      timestamp: Date.now(),
      eventType: 'hold-status',
      itemId: item.metadataId,
      title: item.bibTitle,
      status: item.status,
      position: item.holdsPosition,
      holdId: item.holdsId,
    }, ( err, docs ) => {
      if ( err ) { logger.error( err ); return err; }
      logger.debug( 'hold status inserted...' );
      logger.trace( JSON.stringify( docs ) );
      return { docs };
    } );
    return '...stored';
  } catch ( err ) { logger.error( err ); return err; }
};

const avail = async ( itemId ) => {
  logger.debug( `not holdable availability for itemId ${itemId}...` );

  try {
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );

    logger.debug( 'availability response...' );
    logger.trace( JSON.stringify( data, null, 2 ) );

    const entity = data.entities.bibs[itemId];
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
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data.error ) );
    logger.trace( err );
    return err.response.data.error.message;
  }
};

module.exports = { avail, holdStatus };
