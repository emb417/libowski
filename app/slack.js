const axios = require( 'axios' );
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'slack' );

const oauth = async ( code ) => {
  logger.debug( `oauth ${code}...` );
  try {
    const response = await axios.get( `https://slack.com/api/oauth.access?code=${code}&client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}'` );
    return response.body;
  } catch ( err ) { logger.error( err ); return err; }
};

const postMessage = ( message ) => {
  logger.info( 'posting message...' );
  axios.post( process.env.SLACK_WEBHOOK_URL, { text: `${message}` } );
};

const replyMessage = ( message, response_url ) => {
  logger.info( 'replying to message...' );
  axios.post( response_url, { text: `${message}` } );
};

module.exports = { oauth, postMessage, replyMessage };
