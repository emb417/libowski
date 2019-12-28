const asyncForEach = async ( array, callback ) => {
  for ( let index = 0; index < array.length; index += 1 ) {
    await callback( array[index], index, array ); // eslint-disable-line no-await-in-loop
  }
};

const branchesOfInterest = ['Beaverton City Library', 'Beaverton Murray Scholls Library', 'Tigard Public Library', 'Tualatin Public Library'];

const slack = {
  divider: { type: 'divider' },
  header: ( headerText ) => ( {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: headerText,
    },
  } ),
};

module.exports = { asyncForEach, branchesOfInterest, slack };
