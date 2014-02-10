var connect = require('connect');
var theport = Number(process.env.PORT || 5000);
connect.createServer(
  connect.static(__dirname)
).listen(theport);

