const axios = require( 'axios' );
const log4js = require( 'log4js' );
const fetch = require( './fetch' );

const logger = log4js.getLogger( 'slack' );

const divider = { type: 'divider' };

const oauth = async ( code ) => {
  logger.debug( `oauth ${code}...` );
  try {
    const response = await axios.get( `https://slack.com/api/oauth.access?code=${code}&client_id=${process.env.SLACK_CLIENT_ID}&client_secret=${process.env.SLACK_CLIENT_SECRET}'` );
    return response.body;
  } catch ( err ) { logger.error( err ); return err; }
};

const sendAlert = ( message ) => {
  logger.debug( 'posting sendAlert message...' );
  axios.post( process.env.SLACK_WEBHOOK_URL, { text: `${message}` } );
};

const sendItemInfo = async ( items, responseUrl ) => {
  logger.debug( 'constructing sendItemInfo message...' );
  logger.trace( JSON.stringify( items, null, 2 ) );
  logger.debug( 'fetching account holds...' );
  const holdIds = await fetch.accountHolds( {} );
  logger.debug( `...got account holds ${holdIds}` );
  logger.trace( holdIds );
  const body = { blocks: [] };
  items.forEach( ( item, index ) => {
    let buttonText = 'Request Hold';
    let buttonStyle = 'primary';
    let buttonActionId = 'request-hold';
    if ( holdIds.includes( item.id ) ) {
      buttonText = 'Cancel Hold';
      buttonStyle = 'danger';
      buttonActionId = 'cancel-hold';
    }
    body.blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}. ${item.briefInfo.title}* (${item.id})\n${item.briefInfo.subtitle}`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: buttonText,
          },
          style: buttonStyle,
          value: item.id,
          action_id: buttonActionId,
        },
      },
    );
    body.blocks.push( divider );
    body.blocks.push(
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: item.briefInfo.description || 'No Description',
          },
        ],
      },
    );
    body.blocks.push(
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Year*\n${item.briefInfo.publicationDate}\n\n*Format*\n${item.briefInfo.format}`,
          },
          {
            type: 'mrkdwn',
            text: `*Availability*\n${item.availability.availableCopies} out of ${item.availability.totalCopies}\n\n*Held*\n${item.availability.heldCopies}`,
          },
        ],
        accessory: {
          type: 'image',
          image_url: item.briefInfo.jacket.small,
          alt_text: item.briefInfo.title,
        },
      },
    );
    body.blocks.push( divider );
    const branchesOfInterest = ['Beaverton City Library', 'Beaverton Murray Scholls Library', 'Tigard Public Library', 'Tualatin Public Library'];
    const branchNames = [];
    item.availabilities.forEach( ( availability ) => {
      if ( availability.status === 'AVAILABLE_ITEMS' ) {
        availability.items.forEach(
          ( unit ) => {
            logger.debug( 'unit...' );
            logger.trace( JSON.stringify( unit, null, 2 ) );
            if ( branchesOfInterest.includes( unit.branchName ) ) {
              branchNames.push( `${unit.branchName}${unit.collection.includes( 'Not Holdable' ) ? ' (Not Holdable)' : ''}` );
            }
          },
        );
      }
    } );
    if ( branchNames.length > 0 ) {
      body.blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Available @ Branches of Interest*\n${branchNames.join( '\n' )}`,
          },
        },
      );
      body.blocks.push( divider );
    }
  } );
  logger.debug( 'posting sendItemInfo to slack...' );
  logger.trace( JSON.stringify( body ) );
  try {
    return await axios.post( responseUrl, JSON.stringify( { ...body, response_type: 'in_channel' } ) );
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data ) );
    logger.trace( err );
    return err.response.data;
  }
};

const sendMessage = ( message, responseUrl ) => {
  logger.debug( 'posting message...' );
  try { axios.post( responseUrl, JSON.stringify( { text: message, response_type: 'in_channel' } ) ); } catch ( err ) { logger.error( err ); }
};

module.exports = {
  oauth,
  sendAlert,
  sendItemInfo,
  sendMessage,
};
