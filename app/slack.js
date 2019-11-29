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
  const { holdItemIds, holdsIds } = await fetch.accountHolds( {} );
  logger.debug( `...got account holds ${holdItemIds}` );
  logger.trace( holdItemIds );
  const body = { blocks: [] };
  items.forEach( ( item, index ) => {
    const button = {
      text: 'Request Hold',
      style: 'primary',
      action_id: 'request-hold',
      value: item.id,
    };
    if ( holdItemIds.includes( item.id ) ) {
      button.text = 'Cancel Hold';
      button.style = 'danger';
      button.action_id = 'cancel-hold';
      button.value = `${holdsIds[holdItemIds.indexOf( item.id )]} ${item.id}`;
    }
    body.blocks.push(
      {
        type: 'image',
        image_url: item.briefInfo.jacket.large || '//cor-cdn-static.bibliocommons.com/assets/default_covers/icon-movie-alldiscs-b7d1a6916a9a5872d5f910814880e6c0.png',
        alt_text: item.briefInfo.title,
      },
    );
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
            text: button.text,
          },
          style: button.style,
          value: button.value,
          action_id: button.action_id,
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
