const axios = require( 'axios' );
const log4js = require( 'log4js' );
const { asyncForEach } = require( './utils' );

const logger = log4js.getLogger( 'fetch' );

const accountTokens = async ( { libraryName, libraryPin } ) => {
  logger.debug( 'getting account tokens...' );
  const loginResponse = await axios( {
    method: 'post',
    url: 'https://wccls.bibliocommons.com/user/login',
    params: {
      destination: '%2Fuser_dashboard',
      name: libraryName || process.env.LIBRARY_NAME,
      user_pin: libraryPin || process.env.LIBRARY_PIN,
    },
    headers: {
      Accept: 'application/json',
      'Content-Type': 'x-www-form-urlencoded',
    },
    withCredentials: true,
  } );
  const loginCookies = `${loginResponse.headers['set-cookie']}`;
  logger.debug( 'login cookies...' );
  logger.trace( loginCookies );
  const sessionIdStart = loginCookies.indexOf( 'session_id=' ) + 11;
  const sessionIdLength = 47;
  const sessionId = loginCookies
    .substring( sessionIdStart, sessionIdStart + sessionIdLength );
  const accountId = parseInt( sessionId.split( '-' ).pop(), 10 ) + 1;
  logger.trace( `...got session id ${sessionId} and account id ${accountId}` );
  const accessTokenStart = loginCookies.indexOf( 'bc_access_token=' ) + 16;
  const accessTokenLength = 36;
  const accessToken = loginCookies
    .substring( accessTokenStart, accessTokenStart + accessTokenLength );
  logger.trace( `...got access token ${accessToken}` );
  return {
    accessToken,
    accountId,
    sessionId,
  };
};

const accountCheckouts = async ( { libraryName, libraryPin } ) => {
  logger.debug( 'getting account checkouts...' );
  const {
    accessToken,
    accountId,
    sessionId,
  } = await accountTokens( { libraryName, libraryPin } );

  const checkoutsResponse = await axios( {
    method: 'get',
    url: 'https://gateway.bibliocommons.com/v2/libraries/wccls/checkouts',
    params: {
      accountId,
      size: 25,
      status: '',
      page: 1,
      sort: 'status',
      locale: 'en-US',
    },
    headers: {
      Cookie: `session_id=${sessionId}; bc_access_token=${accessToken};`,
    },
  } );
  logger.trace( `...got account checkouts ${checkoutsResponse.data}` );
  const { checkouts } = checkoutsResponse.data.entities;
  const checkoutsArray = [];
  Object.entries( checkouts ).forEach( ( checkout ) => {
    logger.debug( 'checkout...' );
    logger.trace( JSON.stringify( checkout, null, 2 ) );
    const [, item] = checkout;
    checkoutsArray.push( {
      bibTitle: item.bibTitle,
      actions: item.actions,
      checkoutId: item.checkoutId,
      itemId: item.metadataId,
      dueDate: item.dueDate,
    } );
  } );
  return checkoutsArray;
};

const accountHolds = async ( { libraryName, libraryPin } ) => {
  logger.debug( 'getting account holds...' );
  const {
    accessToken,
    accountId,
    sessionId,
  } = await accountTokens( { libraryName, libraryPin } );

  const holdsResponse = await axios( {
    method: 'get',
    url: 'https://gateway.bibliocommons.com/v2/libraries/wccls/holds',
    params: {
      accountId,
      size: 100,
      page: 1,
      sort: 'holdsPosition',
      locale: 'en-US',
    },
    headers: {
      Cookie: `session_id=${sessionId}; bc_access_token=${accessToken};`,
    },
  } );
  logger.trace( `...got account holds ${holdsResponse.data}` );
  const { holds } = holdsResponse.data.entities;
  const holdArray = { holdsIds: [], holdItemIds: [] };
  await asyncForEach( Object.entries( holds ),
    async ( hold ) => {
      logger.debug( 'hold...' );
      logger.trace( JSON.stringify( hold, null, 2 ) );
      const [, item] = hold;
      if ( item.status === 'NOT_YET_AVAILABLE' ) {
        holdArray.holdItemIds.push( item.metadataId );
        holdArray.holdsIds.push( item.holdsId );
      }
    } );
  return holdArray;
};

const addHold = async ( {
  branchId,
  itemId,
  libraryName,
  libraryPin,
} ) => {
  try {
    logger.debug( `adding hold for itemId ${itemId}...` );
    const {
      accessToken,
      accountId,
      sessionId,
    } = await accountTokens( { libraryName, libraryPin } );
    const response = await axios( {
      url: 'https://gateway.bibliocommons.com/v2/libraries/wccls/holds',
      method: 'post',
      params: {
        locale: 'en-US',
      },
      data: {
        metadataId: itemId,
        materialType: 'PHYSICAL',
        accountId,
        enableSingleClickHolds: false,
        materialParams: {
          branchId: `${branchId || process.env.HOLD_BRANCH_DEFAULT}`,
          expiryDate: null,
          errorMessageLocale: 'en-US',
        },
      },
      headers: {
        Cookie: `session_id=${sessionId}; bc_access_token=${accessToken};`,
      },
    } );
    logger.debug( '...got response from hold request' );
    logger.trace( response );
    const holdItem = Object.entries( response.data.entities.holds )[0];
    logger.debug( '...parsed hold entries' );
    logger.trace( holdItem[1] );
    const {
      metadataId,
      holdsId,
      bibTitle,
      holdsPosition,
      pickupLocation,
    } = holdItem[1];
    return `hold ${holdsId} at position ${holdsPosition} was placed for ${bibTitle} (${metadataId}) to be picked up at ${pickupLocation.name}`;
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data.error ) );
    logger.trace( err );
    return err.response.data.error.message;
  }
};

const cancelHold = async ( {
  itemId,
  holdsId,
  libraryName,
  libraryPin,
} ) => {
  try {
    logger.debug( `cancelling hold for id ${holdsId}...` );
    const {
      accessToken,
      accountId,
      sessionId,
    } = await accountTokens( { libraryName, libraryPin } );
    const response = await axios( {
      url: 'https://gateway.bibliocommons.com/v2/libraries/wccls/holds',
      method: 'delete',
      params: {
        locale: 'en-US',
      },
      data: {
        accountId,
        holdIds: [holdsId],
        metadataIds: [itemId],
      },
      headers: {
        Cookie: `session_id=${sessionId}; bc_access_token=${accessToken};`,
      },
    } );
    logger.debug( '...got response from cancel request' );
    logger.trace( response );
    logger.trace( response.data.analytics.events );
    const { failures } = response;
    return ( typeof failures === 'undefined' ? 'cancel processed, or did it?' : JSON.stringify( failures ) );
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data.error ) );
    logger.trace( err );
    return err.response.data.error.message;
  }
};

const hoursForAll = async () => {
  try {
    logger.debug( 'getting hours for all...' );
    const { data } = await axios.get( 'https://gateway.bibliocommons.com/v2/libraries/wccls/locations?limit=20' );
    logger.debug( '...got locations response' );
    logger.trace( JSON.stringify( data, null, 2 ) );
    const { locations } = data.entities;
    const hoursArray = [];
    Object.entries( locations ).forEach( ( location ) => {
      logger.debug( 'location...' );
      logger.trace( JSON.stringify( location, null, 2 ) );
      const {
        id,
        name,
        customUrl,
        hours,
      } = location[1];
      hoursArray.push( {
        id,
        name,
        customUrl,
        hours,
      } );
    } );

    return hoursArray;
  } catch ( err ) { logger.error( err ); return err; }
};

const infoById = async ( itemId ) => {
  try {
    logger.debug( `getting info for itemId ${itemId}...` );
    const { data } = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/availability/${itemId}` );
    logger.debug( '...got info response' );
    logger.trace( JSON.stringify( data, null, 2 ) );
    const { id, availability, briefInfo } = data.entities.bibs[itemId];
    const availabilities = data.items;
    return {
      id,
      availability,
      availabilities,
      briefInfo,
    };
  } catch ( err ) { logger.error( err ); return err; }
};

const renewCheckout = async ( {
  checkoutId,
  libraryName,
  libraryPin,
} ) => {
  try {
    logger.debug( 'attempting renewal...' );
    const {
      accessToken,
      accountId,
      sessionId,
    } = await accountTokens( { libraryName, libraryPin } );

    const renewalResponse = await axios( {
      method: 'patch',
      url: 'https://gateway.bibliocommons.com/v2/libraries/wccls/checkouts',
      params: {
        locale: 'en-US',
      },
      data: {
        accountId,
        checkoutIds: [checkoutId],
        renew: true,
      },
      headers: {
        Cookie: `session_id=${sessionId}; bc_access_token=${accessToken};`,
      },
    } );
    logger.debug( '...got account checkouts' );
    logger.trace( JSON.stringify( renewalResponse.data ) );
    if ( renewalResponse.data.failures.length > 0 ) {
      logger.debug( '...failures' );
      return renewalResponse.data.failures[0].errorResponseDTO.message;
    }
    if ( renewalResponse.data.borrowing.checkouts.items.length > 0 ) {
      logger.debug( '...renewed' );
      const renewedItem = Object.entries( renewalResponse.data.entities.checkouts )[0][1];
      return `${renewedItem.bibTitle} is now due on ${renewedItem.dueDate}.`;
    }
    logger.debug( '...other' );
    return JSON.stringify( renewalResponse.data );
  } catch ( err ) {
    logger.error( JSON.stringify( err ) );
    logger.trace( err );
    return err;
  }
};

const searchByKeywords = async ( keywords ) => {
  try {
    logger.debug( `getting search results for keywords ${keywords}...` );
    const searchResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search?searchType=smart&query=${keywords}` );
    logger.debug( '...got searchResults' );
    let bibs = [];
    if ( searchResults.data.entities ) {
      bibs = searchResults.data.entities.bibs;
      logger.trace( JSON.stringify( bibs, null, 2 ) );
    }
    const searchArray = [];
    await asyncForEach( Object.entries( bibs ).slice( 0, 3 ),
      async ( bib ) => {
        logger.debug( 'bib...' );
        logger.trace( JSON.stringify( bib, null, 2 ) );
        const { id } = bib[1];
        const item = await infoById( id );
        searchArray.push( item );
      } );
    return searchArray;
  } catch ( err ) { logger.error( err ); return err; }
};

module.exports = {
  accountCheckouts,
  accountHolds,
  accountTokens,
  addHold,
  cancelHold,
  hoursForAll,
  infoById,
  renewCheckout,
  searchByKeywords,
};
