/**
	generic javascript ajax routine
	that is:
		1. not dependent on jquery
		2. returns a promise
	dependencies:
		none
**/
////////////////////////////////////////////////////////////////////////

var ajax = function(url, params, authKV, method, blob, contentType){
	return new Promise(function(resolve, reject){

		var xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function(){
			if(xmlhttp.readyState==4)
			{
				var xhr = xmlhttp.getAllResponseHeaders();
				//console.log('xmlhttp.status: '+xmlhttp.status);
				//console.log( 'responseText: '+ xmlhttp.responseText.length);
				if(xmlhttp.status==200)
				{
					if(blob)
					{
						var result = {
							contentType: xmlhttp.getResponseHeader('content-type'),
							contentDisposition: xmlhttp.getResponseHeader('content-disposition'),
							data: xmlhttp.response
						};
						resolve(result);
					}
					else
						resolve(xmlhttp.responseText);
				}
				else
				{
					reject(xmlhttp.responseText);
				}
			}
		}

		xmlhttp.onprogress = function(pe){
			//if(pe.lengthComputable) {
			//var progress = 100 * pe.loaded / pe.total;
			//console.log( progress +'--'+ xmlhttp.responseText.length);
			//}
			//else
			//{
			//console.log('onprogress...');
			//}
		};

		var getUrl = url;
		var m = method || 'get';
		var m = m.toLowerCase();
		if(m=='get')
		{
			if(params)
			{
				var sparams = serialize(params);
				getUrl += '?' + sparams;
			}
		}
		xmlhttp.open(m, getUrl, true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		if(blob)
			xmlhttp.responseType = blob;
		if(authKV)
		{
			for(key in authKV)
			xmlhttp.setRequestHeader(key, authKV[key]);
		}

		if(m=='post')
		{
			var postparams = params;
			if(contentType)
			{
				xmlhttp.setRequestHeader("Content-type", contentType);
				if(contentType.indexOf('urlencoded') != -1)
				{
					var sparams = serialize(params);
					postparams = sparams;
				}
			}
			else
			{
				//xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.setRequestHeader("Content-type", "application/json");
				postparams = JSON.stringifY(params);
			}
			//xmlhttp.setRequestHeader("Content-length", sparams.length);
			//xmlhttp.setRequestHeader("Connection", "close");
			xmlhttp.send(postparams);
		}
		else if(m=='get')
			xmlhttp.send();
		else
		{
			reject('unknown method:'+m);
		}
	});
};

/**
	serialize a json object to a query string format
	eg. http://abc.com/resource?this=is&the=query&string=
	dependencies:
		none
**/
////////////////////////////////////////////////////////////////////////
function serialize(obj, prefix) {
	var str = [];
	for(var p in obj) {
		if (obj.hasOwnProperty(p)) {
			var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
			str.push(typeof v == "object" ?
			serialize(v, k) :
			encodeURIComponent(k) + "=" + encodeURIComponent(v));
		}
	}
	return str.join("&");
}
/**
	unserialize a query string to a json object
	eg. http://abc.com/resource?this=is&the=query&string=  ==> {"this":"is", "the":"query", "string":""}
	dependencies:
		none
**/
////////////////////////////////////////////////////////////////////////
function unserialize(str) {
  str = decodeURIComponent(str);
  var chunks = str.split('&'),
	  obj = {};
  for(var c=0; c < chunks.length; c++) {
	var split = chunks[c].split('=', 2);
	obj[split[0]] = split[1];
  }
  return obj;
}

/**
	function that search a url string for a given query value
	dependencies:
		none
**/
////////////////////////////////////////////////////////////////////////
function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}
/**
	fill a json object with info...
	dependencies:
		none
**/
////////////////////////////////////////////////////////////////////////
function fillInfo(info){
	if(window.parent)//if this is inside an iframe
	{
		info.host = window.parent.location.host.split(':')[0];
		info.origin = window.parent.location.origin;
		info.protocol = window.parent.location.protocol;
		info.port = window.parent.location.port;
		info.search = unserialize(window.parent.location.search.substring(1));
	}
	else
	{
		info.host = location.host.split(':')[0];
		info.origin = location.origin;
		info.protocol = location.protocol;
		info.port = location.port;
		info.search = unserialize(location.search.substring(1));
	}
}
