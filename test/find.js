/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const fetch = require( '../app/fetch' );

describe( 'Find', function () {
  describe( 'items based on keywords', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 10000 );
      // wargames is a classic that should return results
      response = await fetch.search( 'wargames' );
    } );
    it( 'should respond with more than 30 characters', function () {
      assert( response.length > 30 );
    } );
    it( 'should start with ----', function () {
      assert( response.indexOf( '----' ) === 0 );
    } );
  } );
  describe( 'not holdable availability for item id', function () {
    it( 'should respond with unavailable', async function () {
      this.timeout( 5000 );
      // id for wargames, should never have holdable availability
      const availMessage = await fetch.notHoldableAvailability( 'S143C2099277' );
      assert( availMessage.indexOf( 'Not Holdable Unavailable' ) > -1 );
    } );
    it( 'should respond with available', async function () {
      this.timeout( 5000 );
      // id for spider-man, happens to have not holdable availability
      const availMessage = await fetch.notHoldableAvailability( 'S143C3643101' );
      assert( availMessage.indexOf( 'Library' ) > -1 );
    } );
  } );
} );
