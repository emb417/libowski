/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const fetch = require( '../app/fetch' );

describe.skip( 'Find', function () {
  describe( 'items based on keywords', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 10000 );
      // wargames is a classic that should return results
      response = await fetch.searchByKeywords( 'wargames' );
    } );
    it( 'should respond with more than 30 characters', function () {
      assert( response.length > 1 );
    } );
  } );
} );
