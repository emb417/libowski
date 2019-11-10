/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const { availMessage } = require( '../app/query' );

const noAlert = [
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

const inAlert = [{ ...noAlert[0], branchNames: ['Beaverton Murray Scholls'] }, noAlert[1]];
const outAlert = [noAlert[0], { ...noAlert[1], branchNames: ['Beaverton Murray Scholls'] }];

describe( 'Alert', function () {
  it( 'should not send', function () {
    assert.equal( availMessage( noAlert ), 'No Alert' );
  } );
  it( 'should send in', function () {
    assert.equal( availMessage( inAlert ), 'In' );
  } );
  it( 'should send out', function () {
    assert.equal( availMessage( outAlert ), 'Out' );
  } );
} );
