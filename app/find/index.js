const axios = require('axios');
const express = require('express');
const log4js = require('log4js');
const logger = log4js.getLogger();

const config = {
  "app": "FIND AVAILABILITY",
  "availabilityUrl": "https://gateway.bibliocommons.com/v2/libraries/wccls/availability/",
  "searchUrl": "https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search"
};

const asyncForEach = async (array, callback) => {
  for ( let index = 0; index < array.length; index++ ) {
    await callback( array[index], index, array );
  }
};

const availabilityDetails = async ( itemId, context ) => {

  logger.debug(`getting availability by itemId ${ itemId }...`);

  try {
    const availabilityResults = await axios.get( `${ context.availabilityUrl }${ itemId }` );
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
  } catch ( err ) { return err; }
};

const search = async ( context ) => {

  logger.debug(`searching by keyword ${ context.keywords }...`);

  try {
    const searchResults = await axios.get( `${ context.searchUrl }?searchType=smart&query=${ context.keywords }` );
    const { bibs } = searchResults.data.entities;

    logger.trace(`searchResults...\n${ JSON.stringify(bibs, null, 2) }`);

    let formattedData = "";
    await asyncForEach( Object.entries( bibs ).slice( 0, 5 ),
      async item => {

        logger.trace(`item...\n${ JSON.stringify(item, null, 2) }`);

        const availability = await availabilityDetails( item[1].id, context );

        formattedData += formattedData === "" ? `----` : `\n----`;
        formattedData += `${ item[1].id }----${ item[1].availability.availableCopies }/${ item[1].availability.totalCopies }----${ item[1].briefInfo.title }${ item[1].briefInfo.subtitle ? ` - ${ item[1].briefInfo.subtitle }` : '' } (${ item[1].briefInfo.format })`;
        formattedData += availability === "" ? `` : `\n${ availability }`;
      }
    );
    return formattedData;
  } catch ( err ) { return err; }
};

const app = express.Router( { mergeParams : true } );

app.use( async ( req, res ) => {

  logger.info( `${ config.app } setting context based on ${ req.originalUrl }` );

  const context = {
    ...config,
    keywords: [ req.params.keywords ],
  };

  logger.debug( `searching and sending messsage...` );

  try {
    const results = await search( context );
    res.send( results );
  } catch ( err ) { res.send( err ); }
  
} );

module.exports = app;
