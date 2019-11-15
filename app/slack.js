const axios = require( 'axios' );
const log4js = require( 'log4js' );

const logger = log4js.getLogger( 'slack' );

const postMessage = ( message ) => {
  logger.info( 'posting message...' );
  axios.post( process.env.SLACK_WEBHOOK_URL, { text: `${message}` } );
};

module.exports = { postMessage };
