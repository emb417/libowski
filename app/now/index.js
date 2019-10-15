const axios = require('axios');
const express = require('express');
const log4js = require('log4js');
const logger = log4js.getLogger();

const config = {
  "app": "AVAILABLE NOW",
  "availabilityUrl": "https://gateway.bibliocommons.com/v2/libraries/wccls/availability/"
};

const availabilityDetails = async ( context ) => {

  logger.debug(`getting availability by itemId ${ context.itemId }...`);

  try {
    const availabilityResults = await axios.get( `${ context.availabilityUrl }${ context.itemId }` );
    const { items } = availabilityResults.data;

    logger.trace( `availability response...\n${ JSON.stringify( items, null, 2 ) }` );

    let formattedData = "";
    
    if ( items[0].status === "AVAILABLE_ITEMS" ){
      items[0].items.forEach(
        item => {
          
          logger.trace( `item...\n${ JSON.stringify( item, null, 2 ) }` );
          
          formattedData += formattedData === "" ? `` : `\n`;
          formattedData += `${ item.branchName }`;
        }
      );
    }
    return formattedData;    
  } catch ( err ) { return err; }
};

const app = express.Router( { mergeParams : true } );

app.use( async ( req, res ) => {

  logger.info( `${ config.app } setting context based on ${ req.originalUrl }` );

  const context = {
    ...config,
    itemId: [ req.params.itemId ],
  };

  logger.debug( `getting availability and sending messsage...` );

  try {
    const results = await availabilityDetails( context );
    res.send( results );
  } catch ( err ) { res.send( err ); }

} );

module.exports = app;
