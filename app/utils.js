const asyncForEach = async ( array, callback ) => {
  for ( let index = 0; index < array.length; index += 1 ) {
    await callback( array[index], index, array ); // eslint-disable-line no-await-in-loop
  }
};

const branchesOfInterest = ['Beaverton City Library', 'Beaverton Murray Scholls Library', 'Tigard Public Library', 'Tualatin Public Library'];

const slack = {
  divider: { type: 'divider' },
  header: ( options ) => ( {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: options.headerText,
    },
  } ),
  twoColumnWithButton: ( options ) => ( {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: options.columnOneText,
      },
      {
        type: 'mrkdwn',
        text: options.columnTwoText,
      },
    ],
    accessory: {
      type: 'button',
      style: options.buttonStyle,
      text: {
        type: 'plain_text',
        text: options.buttonText,
      },
      value: options.buttonValue,
      action_id: options.buttonActionId,
    },
  } ),
};

module.exports = { asyncForEach, branchesOfInterest, slack };
