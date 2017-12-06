var
		http  = require( 'http' ),
		https = require( 'https' ),
		Q     = require( 'q' ),
		url   = require( 'url' ),
		util  = require( 'util' );

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
		if ( result.port == undefined ) {
			options.port = result.protocol == "https:" ? 443 : 80;
		}

		options.data = data;

		return this.request( options );
	},

	_stringifyParameters : function ( dataToSend ) {
		if ( dataToSend === undefined ) {
			return undefined;
		}

		var queryStrings = [];
		for ( var key in dataToSend ) {
			queryStrings.push( util.format( "%s=%s", key, dataToSend[ key ] ) );
		}

		return queryStrings.join( '&' );
	},

	request : function ( options ) {
		var deferred = Q.defer();
		var usedLib  = options.port == 443 ? https : http;
		var data     = "";

		if ( options.data !== undefined ) {
			if ( options.format === 'json' ) {
				data = JSON.stringify( options.data );
			} else {
				data = this._stringifyParameters( options.data )
				// data = JSON.stringify( options.data );
			}
		}

		var writeToStream = false;

		if ( ( options.method == "PUT" || options.method == "DELETE" || options.method == "POST") && options.data != undefined ) {
			if ( options.headers == undefined ) {
				options.headers = {}
			}

			if ( options.format === 'json' ) {
				options.headers[ 'Content-Type' ] = 'application/json';
			} else {
				options.headers[ 'Content-Type' ] = 'application/x-www-form-urlencoded';
				// options.body                      = data;
			}

			options.headers[ 'Content-Length' ] = Buffer.byteLength( data );
			delete options.data;
			delete options.format;
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

				deferred.resolve( { status : res.statusCode, data : obj, raw : output } );
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