function handler(event) {
  var request = event.request;
  var host = request.headers.host && request.headers.host.value;
  if (host && host.toLowerCase() === 'www.arsolving.it') {
    var qs = '';
    if (request.querystring) {
      var parts = [];
      for (var k in request.querystring) {
        var v = request.querystring[k];
        if (v.multiValue) {
          for (var i = 0; i < v.multiValue.length; i++) {
            parts.push(k + '=' + v.multiValue[i].value);
          }
        } else {
          parts.push(k + '=' + v.value);
        }
      }
      if (parts.length) qs = '?' + parts.join('&');
    }
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: {
        location: { value: 'https://arsolving.it' + request.uri + qs },
        'cache-control': { value: 'max-age=3600' }
      }
    };
  }
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
  } else if (!uri.includes('.')) {
    request.uri = uri + '/index.html';
  }
  return request;
}
