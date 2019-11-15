const { OAuth2 } = require( 'googleapis' ).google.auth;
const nodemailer = require( 'nodemailer' );
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'smtp' );

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

const sendMessage = ( message ) => {
  logger.info( 'setup...' );
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL,
  );

  oauth2Client.setCredentials( {
    refresh_token: process.env.REFRESH_TOKEN,
  } );
  logger.info( 'get accessToken...' );
  const accessToken = oauth2Client.getAccessToken();

  const { auth } = smtpTransportcfg;

  const smtpTransport = nodemailer.createTransport(
    { ...smtpTransportcfg, auth: { accessToken, ...auth } },
  );
  logger.info( 'send message...' ); logger.debug( `${message}` );
  const mailOptions = {
    from: `${process.env.USER_NAME} <${process.env.USER_EMAIL}>`,
    to: process.env.SMTP_ADDRESSES,
    subject: 'Availability Status Update',
    text: `${message}`,
  };
  smtpTransport.sendMail( mailOptions, ( error, response ) => {
    if ( error ) { logger.error( error ); } else { logger.trace( response ); }
    smtpTransport.close();
  } );
};

module.exports = { sendMessage };
