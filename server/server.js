var express = require('express');
var request = require('request');
var app = express();

//Import ENV from .env file:
require('dotenv').config();

if( !process.env.LIBRARIES_IO_API_KEY ){
  console.error('LIBRARIES_IO_API_KEY not set (You can create a .env file from sample.env, or set it in your environment.)');
  process.exit(1);
}

app.get('/tree', function (req, res) {
  if( !req.query.platform || !req.query.name ){
    res.status(400).send('Expected platform and name query parameters');
    return;
  }
  //modify the url in any way you want
  var url = 'https://libraries.io/api/'+req.query.platform+'/'+req.query.name+'/tree?api_key='+process.env.LIBRARIES_IO_API_KEY;
  //TODO: Cache. Redis?
  request(url).pipe(res);
});

//Serve the site's static files (These could come from any static HTTP server, but as we need to run this one for the /tree proxy calls, may as well also serve static files)
app.use(express.static('site'));

app.listen(80, function () {
  console.log('Server listening on port 80!')
});

