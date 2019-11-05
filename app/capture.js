const axios = require( 'axios' );
const log4js = require( 'log4js' );
const path = require( 'path' );

const logger = log4js.getLogger( 'events' );
const Datastore = require( 'nedb' );

const db = new Datastore( { filename: path.join( __dirname, '..', 'data', 'libowski.db' ), autoload: true } );

const event = async ( itemId ) => {
  logger.debug( `not holdable availability for itemId ${itemId}...` );

  try {
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );

    logger.trace( 'availability response...\n' ); // ${JSON.stringify( data, null, 2 )}

    const entity = data.entities.bibs[itemId];

    db.insert( {
      timestamp: Date.now(),
      id: entity.briefInfo.id,
      title: entity.briefInfo.title,
      subtitle: entity.briefInfo.subtitle,
      format: entity.briefInfo.format,
      description: entity.briefInfo.description,
      publicationDate: entity.briefInfo.publicationDate,
    }, ( err, docs ) => {
      if ( err ) { logger.error( err ); return err; }
      logger.trace( `entity inserted...\n\n${JSON.stringify( docs )}\n` );
      return { docs };
    } );
    return `...inserted ${entity.briefInfo.title}`;
  } catch ( err ) { logger.error( err ); return err; }
};

module.exports = event;
