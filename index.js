var
		http  = require( 'http' ),
		https = require( 'https' ),
		Q     = require( 'q' ),
		url   = require( 'url' );

var requestOptions = {
	host    : undefined,
	port    : undefined,
	path    : undefined,
	headers : {
		'Content-Type' : 'application/json'
	}
};

var interface = {
	requestUrl : function ( targetUrl, method, data ) {
		method = method.toUpperCase() || "GET";

		var result     = url.parse( targetUrl );
		var options    = JSON.parse( JSON.stringify( requestOptions ) );
		options.method = method;
		options.host   = result.hostname;
		options.path   = result.path;
		options.port   = result.port;
		options.data   = data;

		return this.request( options );
	},

	request : function ( options ) {
		var deferred      = Q.defer();
		var usedLib       = options.port == 443 ? https : http;
		var data          = options.data == undefined ? "" : JSON.stringify( options.data );
		var writeToStream = false;

		if ( ( options.method == "PUT" || options.method == "DELETE" || options.method == "POST") && options.data != undefined ) {
			if ( options.headers == undefined ) {
				options.headers = {}
			}

			options.headers[ 'Content-Type' ]   = 'application/json';
			options.headers[ 'Content-Length' ] = Buffer.byteLength( data );
			delete options.data;
			writeToStream = true;
		}

		var req = usedLib.request( options, function ( res ) {
			var output = '';

			res.setEncoding( 'utf8' );

			res.on( 'data', function ( chunk ) {
				output += chunk;
			} );

			res.on( 'end', function () {
				var obj = "";

				if ( res.statusCode == 200 ) {
					obj = JSON.parse( output );
				}

				deferred.resolve( { status : res.statusCode, data : obj } );
			} );
		} );

		req.on( 'error', function ( err ) {
			deferred.reject( err );
		} );

		if ( writeToStream ) {
			req.write( data );
		}

		req.end();

		return deferred.promise;

	}
};

module.exports = interface;