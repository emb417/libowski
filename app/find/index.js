const axios = require('axios');
const express = require('express');
const log4js = require('log4js');
const logger = log4js.getLogger();

const config = {
  "app": "FIND AVAILABILITY",
  "searchUrl": "https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search"
};

const search = async ( context ) => {

  logger.debug(`searching by keyword ${ context.keywords }...`);

  try {
    const searchResults = await axios.get( `${ context.searchUrl }?searchType=smart&query=${ context.keywords }` );
    const { bibs } = searchResults.data.entities;

    logger.trace(`searchResults...\n${ JSON.stringify(bibs, null, 2) }`);

    let formattedData = "";
    Object.entries(bibs).forEach(
      item => {

        logger.trace(`item...\n${ JSON.stringify(item, null, 2) }`);

        formattedData += formattedData === "" ? `----` : `\n----`;
        formattedData += `${ item[1].id }----${ item[1].availability.availableCopies }/${ item[1].availability.totalCopies }----${ item[1].briefInfo.title }(${ item[1].briefInfo.format })`;
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
