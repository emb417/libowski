const axios = require('axios');
const log4js = require('log4js');
const logger = log4js.getLogger('fetch');

const asyncForEach = async (array, callback) => {
  for ( let index = 0; index < array.length; index++ ) {
    await callback( array[index], index, array );
  }
};

const availabilityDetails = async ( itemId ) => {

  logger.debug(`availability for itemId ${ itemId }...`);

  try {
    const availabilityResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${ itemId }` );
    const { items } = availabilityResults.data;

    logger.trace( `availability response...\n${ JSON.stringify( items, null, 2 ) }` );

    let formattedData = "";

    items.forEach(
      item => {
        if ( item.status === "AVAILABLE_ITEMS" ){
          item.items.forEach(
            item => {
              
              logger.trace( `item...\n${ JSON.stringify( item, null, 2 ) }` );
              
              formattedData += formattedData === "" ? `` : `\n`;
              formattedData += `${ item.branchName }${ item.collection === 'Best Sellers - Not Holdable' ? ' (Not Holdable)' : '' }`;
    
            }
          );
        }
      }
    );

    return formattedData;    
  } catch ( err ) { logger.error(err); return; }
};

const notHoldableAvailability = async ( itemId ) => {

  logger.debug(`not holdable availability for itemId ${ itemId }...`);

  try {
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${ itemId }` );

    logger.trace( `availability response...\n${ JSON.stringify( data, null, 2 ) }` );

    const entity = data.entities.bibs[itemId];

    let formattedData = "";
    formattedData += `${ entity.briefInfo.title }${ entity.briefInfo.subtitle ? ` - ${ entity.briefInfo.subtitle }` : '' } (${ entity.briefInfo.format }) (Not Holdable)\n`;

    data.items.forEach(
      item => {
        if ( item.status === "AVAILABLE_ITEMS" ){
          item.items.forEach(
            item => {
              
              logger.trace( `item...\n${ JSON.stringify( item, null, 2 ) }` );
              
              formattedData += item.collection.includes('Not Holdable') ? ` - ${ item.branchName }\n` : ``;
            }
          );
        }
      }
    );

    return formattedData;    
  } catch ( err ) { logger.error(err); return; }
};

const search = async ( keywords ) => {

  logger.debug(`search results for keywords ${ keywords }...`);

    try {
      const searchResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search?searchType=smart&query=${ keywords }` );
      const { bibs } = searchResults.data.entities;
  
      logger.trace(`searchResults...\n${ JSON.stringify(bibs, null, 2) }`);
  
      let formattedData = "";
      await asyncForEach( Object.entries( bibs ).slice( 0, 5 ),
        async item => {
  
          logger.trace(`item...\n${ JSON.stringify(item, null, 2) }`);
  
          const availability = await availabilityDetails( item[1].id );
  
          formattedData += formattedData === "" ? `----` : `\n----`;
          formattedData += `${ item[1].id }----${ item[1].availability.availableCopies }/${ item[1].availability.totalCopies }----${ item[1].briefInfo.title }${ item[1].briefInfo.subtitle ? ` - ${ item[1].briefInfo.subtitle }` : '' } (${ item[1].briefInfo.format })`;
          formattedData += availability === "" ? `` : `\n${ availability }`;
        }
      );
      return formattedData;
    } catch ( err ) { return err; }
  };

  module.exports = { search, availabilityDetails, notHoldableAvailability };