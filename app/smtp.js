const { OAuth2 } = require( 'googleapis' ).google.auth;
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'oauth' );

const smtpTransportcfg = {
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.USER_EMAIL,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
};

const transportConfig = () => {
  logger.info( 'setup...' );
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL,
  );

  oauth2Client.setCredentials( {
    refresh_token: process.env.REFRESH_TOKEN,
  } );
  logger.info( 'accessToken...' );
  const accessToken = oauth2Client.getAccessToken();

  const { auth } = smtpTransportcfg;
  return { ...smtpTransportcfg, auth: { accessToken, ...auth } };
};

module.exports = { transportConfig };
