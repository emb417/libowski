const path = require( 'path' );
const Datastore = require( 'nedb-promises' );

const db = Datastore.create( path.join( __dirname, '..', 'data', 'libowski.db' ) );

const avail = async ( id ) => db.find( { id }, {
  timestamp: 1,
  id: 1,
  title: 1,
  format: 1,
  publicationDate: 1,
  branchNames: 1,
  _id: 0,
} ).sort( {
  timestamp: -1,
} ).limit( 2 );

module.exports = { avail };
