/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const { availMessage } = require( '../app/query' );

describe( 'Alert', function () {
  let noAlert = [];
  beforeEach( () => {
    noAlert = [
      {
        timestamp: 1573420574159,
        id: 'S143C2099277',
        title: 'WarGames',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: [],
      },
      {
        timestamp: 1573420540596,
        id: 'S143C2099277',
        title: 'WarGames',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: [],
      },
    ];
  } );
  it( 'should not send', function () {
    assert.equal( availMessage( noAlert ), 'No Alert' );
  } );
  it( 'should send in', function () {
    const inAlert = [{ ...noAlert[0], branchNames: ['Beaverton Murray Scholls'] }, noAlert[1]];
    const title = `${inAlert[0].title}${inAlert[0].subtitle
      ? ` - ${inAlert[0].subtitle}` : ''} (${inAlert[0].format})`;
    assert.equal( availMessage( inAlert ), `${title} is @ Beaverton Murray Scholls` );
  } );
  it( 'should send out', function () {
    const outAlert = [noAlert[0], { ...noAlert[1], branchNames: ['Beaverton Murray Scholls'] }];
    const title = `${outAlert[0].title}${outAlert[0].subtitle
      ? ` - ${outAlert[0].subtitle}` : ''} (${outAlert[0].format})`;
    assert.equal( availMessage( outAlert ), `${title} is GONE @ Beaverton Murray Scholls` );
  } );
} );
