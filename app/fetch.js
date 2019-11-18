const axios = require( 'axios' );
const log4js = require( 'log4js' );
const { asyncForEach } = require( './utils' );

const logger = log4js.getLogger( 'fetch' );

const notHoldableAvailability = async ( itemId ) => {
  logger.debug( `getting not holdable availability for itemId ${itemId}...` );

  try {
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );
    logger.debug( '...got availability response' );
    logger.trace( JSON.stringify( data, null, 2 ) );
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
              logger.debug( 'unit...' );
              logger.trace( JSON.stringify( unit, null, 2 ) );
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
  try {
    logger.debug( `getting search results for keywords ${keywords}...` );
    const searchResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search?searchType=smart&query=${keywords}` );
    logger.debug( '...got searchResults' );
    const { bibs } = searchResults.data.entities;
    logger.trace( JSON.stringify( bibs, null, 2 ) );
    let formattedData = '';
    // format data including first five bibs
    await asyncForEach( Object.entries( bibs ).slice( 0, 5 ),
      async ( bib ) => {
        logger.debug( 'bib...' );
        logger.trace( JSON.stringify( bib, null, 2 ) );
        formattedData += `----${bib[1].id}`;
        formattedData += `----${bib[1].availability.availableCopies}/${bib[1].availability.totalCopies}`;
        formattedData += `----${bib[1].briefInfo.title}${bib[1].briefInfo.subtitle ? ` - ${bib[1].briefInfo.subtitle}` : ''} (${bib[1].briefInfo.format})\n`;
        const availabilityResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${bib[1].id}` );
        logger.debug( 'availability response...' );
        const availabilities = availabilityResults.data.items;
        logger.trace( JSON.stringify( availabilities, null, 2  ));
        availabilities.forEach(
          ( availability ) => {
            if ( availability.status === 'AVAILABLE_ITEMS' ) {
              availability.items.forEach(
                ( unit ) => {
                  logger.debug( 'unit...' );
                  logger.trace( JSON.stringify( unit, null, 2 ) );
                  formattedData += `${unit.branchName}${unit.collection === 'Best Sellers - Not Holdable' ? ' (Not Holdable)' : ''}\n`;
                },
              );
            }
          },
        );
      } );
    return formattedData;
  } catch ( err ) { logger.error( err ); return err; }
};

module.exports = { search, notHoldableAvailability };
