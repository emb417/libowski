/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const axios = require( 'axios' );

describe( 'API', function () {
  describe( 'index route', function () {
    let response;
    this.beforeAll( function ( done ) {
      this.timeout( 1000 );
      setTimeout( async () => {
        response = await axios.get( 'http://localhost:1337/' );
        done();
        // wait 500ms to let server restart
      }, 500 );
    } );
    it( 'should respond', async function () {
      assert.equal( response.status, '200' );
    } );
    it( 'should not abide', async function () {
      assert.equal( response.data, 'The Dude does not abide!' );
    } );
  } );
} );
