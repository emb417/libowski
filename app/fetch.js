const axios = require( 'axios' );
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'fetch' );

const asyncForEach = async ( array, callback ) => {
  for ( let index = 0; index < array.length; index += 1 ) {
    await callback( array[index], index, array ); // eslint-disable-line no-await-in-loop
  }
};

const availabilityDetails = async ( itemId ) => {
  logger.debug( `availability for itemId ${itemId}...` );

  try {
    const availabilityResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );
    logger.trace( 'availability response...\n' ); // ${JSON.stringify( items, null, 2 )}
    const { items } = availabilityResults.data;

    let formattedData = '';
    items.forEach(
      ( item ) => {
        if ( item.status === 'AVAILABLE_ITEMS' ) {
          item.items.forEach(
            ( unit ) => {
              logger.trace( 'unit...\n' ); // ${JSON.stringify( unit, null, 2 )}
              formattedData += `${unit.branchName}${unit.collection === 'Best Sellers - Not Holdable' ? ' (Not Holdable)' : ''}\n`;
            },
          );
        }
      },
    );

    return formattedData;
  } catch ( err ) { logger.error( err ); return err; }
};

const notHoldableAvailability = async ( itemId ) => {
  logger.debug( `not holdable availability for itemId ${itemId}...` );

  try {
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );
    logger.trace( 'availability response...\n' ); // ${JSON.stringify( data, null, 2 )}
    const entity = data.entities.bibs[itemId];

    // format data starting with header
    let formattedData = '';
    formattedData += `${entity.briefInfo.title}${entity.briefInfo.subtitle ? ` - ${entity.briefInfo.subtitle}` : ''} (${entity.briefInfo.format})\n`;

    // add branch names where item is available
    let branchNames = '';
    data.items.forEach(
      ( item ) => {
        if ( item.status === 'AVAILABLE_ITEMS' ) {
          item.items.forEach(
            ( unit ) => {
              logger.trace( 'unit...\n' ); // ${JSON.stringify( unit, null, 2 )}
              branchNames += unit.collection.includes( 'Not Holdable' ) ? ` - ${unit.branchName}\n` : '';
            },
          );
        }
      },
    );
    const results = formattedData + ( branchNames !== '' ? `${branchNames}\n` : 'Not Holdable Unavailable\n\n' );
    return results;
  } catch ( err ) { logger.error( err ); return err; }
};

const search = async ( keywords ) => {
  logger.debug( `search results for keywords ${keywords}...` );

  try {
    const searchResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search?searchType=smart&query=${keywords}` );
    logger.trace( 'searchResults...\n' ); // ${JSON.stringify( bibs, null, 2 )}
    const { bibs } = searchResults.data.entities;

    // format data including first five bibs
    let formattedData = '';
    await asyncForEach( Object.entries( bibs ).slice( 0, 5 ),
      async ( item ) => {
        const availability = await availabilityDetails( item[1].id );

        formattedData += `----${item[1].id}`;
        formattedData += `----${item[1].availability.availableCopies}/${item[1].availability.totalCopies}`;
        formattedData += `----${item[1].briefInfo.title}${item[1].briefInfo.subtitle ? ` - ${item[1].briefInfo.subtitle}` : ''} (${item[1].briefInfo.format})\n`;
        formattedData += availability === '' ? '' : `${availability}\n`;
      } );
    return formattedData;
  } catch ( err ) { return err; }
};

module.exports = { search, notHoldableAvailability };
