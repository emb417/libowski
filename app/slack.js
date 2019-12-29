const axios = require( 'axios' );
const log4js = require( 'log4js' );
const fetch = require( './fetch' );
const { branchesOfInterest, slack } = require( './utils' );

const logger = log4js.getLogger( 'slack' );

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

const sendCheckoutsInfo = async ( checkouts, responseUrl ) => {
  logger.debug( 'constructing sendCheckoutsInfo message...' );
  logger.trace( JSON.stringify( checkouts, null, 2 ) );
  const body = { blocks: [] };
  body.blocks.push( slack.header( { headerText: '*Checkouts*' } ) );
  body.blocks.push( slack.twoColumnWithButton( {
    columnOneText: '*Title*',
    columnTwoText: '*Due Date*',
    buttonText: 'Renew Below',
    buttonValue: 'no-renew',
    buttonActionId: 'no-renew',
  } ) );
  checkouts.forEach( ( checkout ) => {
    const checkoutOptions = {
      columnOneText: `${checkout.bibTitle}`,
      columnTwoText: `${checkout.dueDate}`,
      buttonText: 'No Renew',
      buttonValue: checkout.checkoutId,
      buttonActionId: 'no-renew',
    };
    if ( checkout.actions.includes( 'renew' ) ) {
      checkoutOptions.buttonText = 'Renew';
      checkoutOptions.buttonStyle = 'primary';
      checkoutOptions.buttonActionId = `renew-${checkout.itemId}`;
    }
    logger.debug( '...checkout options' );
    logger.trace( JSON.stringify( checkoutOptions ) );
    body.blocks.push( slack.divider );
    body.blocks.push( slack.twoColumnWithButton( checkoutOptions ) );
    body.blocks.push( slack.divider );
  } );
  logger.debug( '...body' );
  logger.trace( JSON.stringify( body ) );
  try {
    return await axios.post( responseUrl, JSON.stringify( { ...body, response_type: 'ephemeral' } ) );
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data ) );
    logger.trace( err );
    return err.response.data;
  }
};

const sendHoldsInfo = async ( holds, responseUrl ) => {
  logger.debug( 'sending holds info...' );
  logger.trace( JSON.stringify( holds, null, 2 ) );
  const body = { blocks: [] };
  body.blocks.push( slack.header( { headerText: '*Holds*' } ) );
  body.blocks.push( slack.twoColumnWithButton( {
    columnOneText: '*Title*',
    columnTwoText: '*Position*',
    buttonText: 'Cancel Below',
    buttonValue: 'no-cancel',
    buttonActionId: 'no-cancel',
  } ) );
  holds.forEach( ( hold ) => {
    let holdPositionStatus = `${hold.holdsPosition}`;
    if ( hold.status === 'IN_TRANSIT' ) {
      holdPositionStatus = 'In Transit';
    } else if ( hold.status === 'READY_FOR_PICKUP' ) {
      holdPositionStatus = 'Ready';
    }
    const holdOptions = {
      columnOneText: `${hold.bibTitle}`,
      columnTwoText: holdPositionStatus,
      buttonText: 'No Cancel',
      buttonValue: hold.holdsId,
      buttonActionId: 'no-cancel',
    };
    if ( hold.actions.includes( 'cancel' ) ) {
      holdOptions.buttonText = 'Cancel Hold';
      holdOptions.buttonStyle = 'danger';
      holdOptions.buttonActionId = `cancel-hold-${hold.holdsId}`;
      holdOptions.buttonValue = `${hold.holdsId} ${hold.metadataId}`;
    }
    logger.debug( '...hold options' );
    logger.trace( JSON.stringify( holdOptions ) );
    body.blocks.push( slack.divider );
    body.blocks.push( slack.twoColumnWithButton( holdOptions ) );
  } );
  logger.debug( '...body' );
  logger.trace( JSON.stringify( body ) );
  try {
    return await axios.post( responseUrl, JSON.stringify( { ...body, response_type: 'ephemeral' } ) );
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data ) );
    logger.trace( err );
    return err.response.data;
  }
};

const sendHoursInfo = async ( hoursForAll, responseUrl ) => {
  logger.debug( 'constructing sendHoursInfo message...' );
  logger.trace( JSON.stringify( hoursForAll, null, 2 ) );
  const body = { blocks: [] };
  body.blocks.push( slack.header( { headerText: '*Locations and Hours*' } ) );
  hoursForAll.forEach( ( location ) => {
    if ( branchesOfInterest.includes( location.name ) ) {
      let hoursText = '*Hours*\n';
      location.hours.forEach( ( day ) => {
        hoursText += `${day.timeRef} ${day.openTime.substring( 1 )}-${day.closeTime.substring( 1 )}\n`;
      } );
      body.blocks.push( slack.twoColumn( {
        columnOneText: `*Location*\n${location.name}`,
        columnTwoText: hoursText,
      } ) );
      body.blocks.push( slack.divider );
    }
  } );
  try {
    return await axios.post( responseUrl, JSON.stringify( { ...body, response_type: 'in_channel' } ) );
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data ) );
    logger.trace( err );
    return err.response.data;
  }
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
    body.blocks.push( slack.image( {
      url: item.briefInfo.jacket.large || '//cor-cdn-static.bibliocommons.com/assets/default_covers/icon-movie-alldiscs-b7d1a6916a9a5872d5f910814880e6c0.png',
      alt: item.briefInfo.title,
    } ) );
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
    body.blocks.push( slack.divider );
    body.blocks.push( slack.context( { contextText: item.briefInfo.description || 'No Description' } ) );
    body.blocks.push( slack.twoColumn( {
      columnOneText: `*Year*\n${item.briefInfo.publicationDate}\n\n*Format*\n${item.briefInfo.format}`,
      columnTwoText: `*Availability*\n${item.availability.availableCopies} out of ${item.availability.totalCopies}\n\n*Held*\n${item.availability.heldCopies}`,
    } ) );
    body.blocks.push( slack.divider );
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
    logger.debug( '...branchNames of available items' );
    logger.trace( JSON.stringify( branchNames ) );
    if ( branchNames.length > 0 ) {
      body.blocks.push( slack.header( { headerText: `*Available @ Branches of Interest*\n${branchNames.join( '\n' )}` } ) );
      body.blocks.push( slack.divider );
    }
  } );
  logger.debug( 'posting sendItemInfo to slack...' );
  logger.trace( JSON.stringify( body ) );
  try {
    return await axios.post( responseUrl, JSON.stringify( { ...body, response_type: 'ephemeral' } ) );
  } catch ( err ) {
    logger.error( JSON.stringify( err.response.data ) );
    logger.trace( err );
    return err.response.data;
  }
};

module.exports = {
  oauth,
  sendAlert,
  sendCheckoutsInfo,
  sendHoldsInfo,
  sendHoursInfo,
  sendItemInfo,
};
