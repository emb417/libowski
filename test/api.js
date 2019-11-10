/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-undef */
const assert = require( 'assert' );
const axios = require( 'axios' );

describe( 'Server', function () {
  describe( 'index route', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 100 );
      response = await axios.get( 'http://localhost:1337/' );
    } );
    it( 'should respond', async function () {
      assert.equal( response.status, '200' );
    } );
    it( 'should not abide', async function () {
      assert.equal( response.data, 'The Dude does not abide!' );
    } );
  } );
  describe( 'find route', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 5000 );
      // wargames is a classic that should return results
      response = await axios.get( 'http://localhost:1337/find/wargames' );
    } );
    it( 'should respond', function () {
      assert.equal( response.status, '200' );
    } );
    it( 'should have data', function () {
      assert.ok( response.data );
    } );
  } );
  describe( 'now route', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 5000 );
      // S143C2099277 is the wargames bluray title
      response = await axios.get( 'http://localhost:1337/now/S143C2099277' );
    } );
    it( 'should respond', function () {
      assert.equal( response.status, '200' );
    } );
    it( 'should have data', function () {
      assert.ok( response.data );
    } );
  } );
  describe( 'insert route', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 5000 );
      // S143C2099277 is the wargames bluray title
      response = await axios.get( 'http://localhost:1337/insert/S143C2099277' );
    } );
    it( 'should respond', function () {
      assert.equal( response.status, '200' );
    } );
    it( 'should have data', function () {
      assert.ok( response.data );
    } );
  } );
  describe( 'avail route', function () {
    let response;
    this.beforeAll( async function () {
      this.timeout( 5000 );
      // S143C2099277 is the wargames bluray title
      await axios.get( 'http://localhost:1337/insert/S143C2099277' );
      response = await axios.get( 'http://localhost:1337/avail/S143C2099277' );
    } );
    it( 'should respond', function () {
      assert.equal( response.status, '200' );
    } );
    it( 'should have data', function () {
      assert.ok( response.data );
    } );
  } );
} );