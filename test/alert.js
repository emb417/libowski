/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const capture = require( '../app/capture' );
const query = require( '../app/query' );

describe( 'Alert', function () {
  it.skip( 'should capture avail', async function () {
    const captureAvail = await capture.avail( 'S143C2099277' );
    assert.equal( captureAvail, '...inserted WarGames' );
  } );
  it( 'should not send an alert with no avail events', function () {
    const noAvailEvents = [];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( noAvailEvents );
    assert( availableAtBranchNames.length === 0 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should not send an alert with one avail event and branchNames is empty', function () {
    const noBranchNames = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: [],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( noBranchNames );
    assert( availableAtBranchNames.length === 0 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should send an alert with one avail event and one branch name', function () {
    const oneAvailOneBranch = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( oneAvailOneBranch );
    assert( availableAtBranchNames.length === 1 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should send an alert with one avail event and many branch names', function () {
    const oneAvailOneBranch = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library', 'Beaverton City Library', 'Tualatin City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( oneAvailOneBranch );
    assert( availableAtBranchNames.length === 3 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should not send an alert with multiple events and branchNames are empty', function () {
    const noBranchNames = [
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
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( noBranchNames );
    assert( availableAtBranchNames.length === 0 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should send IN with one in avail', function () {
    const oneInAvail = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Tualatin City Library'],
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
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( oneInAvail );
    assert( availableAtBranchNames.length === 1 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should send GONE with simple case', function () {
    const oneGoneAvail = [
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
        branchNames: ['Beaverton City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( oneGoneAvail );
    assert( availableAtBranchNames.length === 0 );
    assert( goneAtBranchNames.length === 1 );
  } );
  it( 'should send GONE with same branch in and out', function () {
    const sameGoneBranches = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library'],
      },
      {
        timestamp: 1573420540596,
        itemId: 'S143C2099277',
        title: 'WarGames',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library', 'Beaverton City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( sameGoneBranches );
    assert( availableAtBranchNames.length === 0 );
    assert( goneAtBranchNames.length === 1 );
  } );
  it( 'should send GONE with prior event having multiple of same branch', function () {
    const sameGoneBranches = [
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
        branchNames: ['Beaverton City Library', 'Beaverton City Library', 'Tualatin City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( sameGoneBranches );
    assert( availableAtBranchNames.length === 0 );
    assert( goneAtBranchNames.length === 3 );
  } );
  it( 'should send IN with same branches in', function () {
    const sameInBranches = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library', 'Beaverton City Library'],
      },
      {
        timestamp: 1573420540596,
        itemId: 'S143C2099277',
        title: 'WarGames',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( sameInBranches );
    assert( availableAtBranchNames.length === 1 );
    assert( goneAtBranchNames.length === 0 );
  } );
  it( 'should send IN and OUT with swapping case', function () {
    const swapAvails = [
      {
        timestamp: 1573420574159,
        itemId: 'S143C2099277',
        title: 'WarGames',
        subtitle: 'The Movie',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton City Library'],
      },
      {
        timestamp: 1573420540596,
        itemId: 'S143C2099277',
        title: 'WarGames',
        format: 'BLURAY',
        publicationDate: '2012',
        branchNames: ['Beaverton Murray Scholls', 'Tigard City Library'],
      },
    ];
    const { availableAtBranchNames, goneAtBranchNames } = query.compareAvail( swapAvails );
    assert( availableAtBranchNames.length === 1 );
    assert( goneAtBranchNames.length === 2 );
  } );
} );
