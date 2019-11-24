const axios = require( 'axios' );
const log4js = require( 'log4js' );
const { asyncForEach } = require( './utils' );

const logger = log4js.getLogger( 'fetch' );

const accountTokens = async ( libraryName, libraryPin ) => {
  logger.debug( 'getting account tokens...' );
  const loginResponse = await axios( {
    method: 'post',
    url: 'https://wccls.bibliocommons.com/user/login?destination=%2Fuser_dashboard',
    params: {
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
  const sessionIdStart = loginCookies.indexOf( 'session_id=' ) + 11;
  const sessionIdLength = 47;
  const sessionId = loginCookies
    .substring( sessionIdStart, sessionIdStart + sessionIdLength );
  logger.trace( `...got session id ${sessionId}` );
  const accountId = parseInt( sessionId.split( '-' ).pop(), 10 ) + 1;
  const accessTokenStart = loginCookies.indexOf( 'bc_access_token=' ) + 16;
  const accessTokenLength = 36;
  const accessToken = loginCookies
    .substring( accessTokenStart, accessTokenStart + accessTokenLength );
  logger.trace( `...got access token ${accessToken}` );
  return { accessToken, accountId, sessionId };
};

const accountHolds = async ( libraryName, libraryPin ) => {
  logger.debug( 'getting account holds...' );
  const { accessToken, accountId, sessionId } = await accountTokens( libraryName, libraryPin );

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
  const holdArray = [];
  await asyncForEach( Object.entries( holds ),
    async ( hold ) => {
      logger.debug( 'hold...' );
      logger.trace( JSON.stringify( hold, null, 2 ) );
      const [, item] = hold;
      if ( item.status === 'NOT_YET_AVAILABLE' ) {
        holdArray.push( item.metadataId );
      }
    } );
  return holdArray;
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

const searchByKeywords = async ( keywords ) => {
  try {
    logger.debug( `getting search results for keywords ${keywords}...` );
    const searchResults = await axios.get( `https://gateway.bibliocommons.com/v2/libraries/wccls/bibs/search?searchType=smart&query=${keywords}` );
    logger.debug( '...got searchResults' );
    const { bibs } = searchResults.data.entities;
    logger.trace( JSON.stringify( bibs, null, 2 ) );
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
  accountHolds,
  accountTokens,
  infoById,
  searchByKeywords,
};
