"use strict";


const http = require('http');

const server = http.createServer((request, response) =>{
  console.log(request.protocol);
  console.log("URLS:", request.url);

  response.setHeader('Testing','Tfd ds');

  if (request.url.split('://')[0] === 'http'){
    console.log('http, at URL', request.url);
    http.get(request.url, (resp) =>{
      resp.pipe(response);


    }).on('error', err =>{
      console.log('Error message: ', err.message);
    });
  }
  else {
    console.log('https');
  }
});

server.listen(8080);
