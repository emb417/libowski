/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const query = require( '../app/query' );
const capture = require( '../app/capture' );

describe( 'Alert', function () {
  let noAlert = [];
  beforeEach( () => {
    noAlert = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: [],
      },
      {
        timestamp: 1573420540596,
        itemId: 'S143C2099277',
        title: 'WarGames',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: [],
      },
    ];
  } );
  it.skip( 'should capture avail', async function () {
    const captureAvail = await capture.avail( 'S143C2099277' );
    assert.equal( captureAvail, '...inserted WarGames' );
  } );
  it.skip( 'should not send', async function () {
    const alert = await query.avail( 'S143C2099277' );
    assert.equal( alert, 'No Alert' );
  } );
  it.skip( 'should send in', function () {
    const inAlert = [{ ...noAlert[0], branchNames: ['Beaverton Murray Scholls'] }, noAlert[1]];
    const title = `${inAlert[0].title} - ${inAlert[0].subtitle} (${inAlert[0].format})`;
    assert.equal( query.avail( inAlert ), `${title} is @ Beaverton Murray Scholls` );
  } );
  it.skip( 'should send out', function () {
    const outAlert = [{ ...noAlert[0], subtitle: '' }, { ...noAlert[1], branchNames: ['Beaverton Murray Scholls'] }];
    const title = `${outAlert[0].title} (${outAlert[0].format})`;
    assert.equal( query.avail( outAlert ), `${title} is GONE @ Beaverton Murray Scholls` );
  } );
} );
