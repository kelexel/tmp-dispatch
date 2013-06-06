  var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var hub = require('clusterhub');
var logger = require(__dirname+'/lib/logger.js')
// var numCPUs = 2;

cluster.setupMaster({
  exec : "worker.js",
  args : [],
  silent : false
});

// var daemon = require(__dirname+'/server.js');
if (cluster.isMaster) {
  // Fork workers.
  logger.info('Found '+numCPUs+' CPU cores');
  for (var i = 0; i < numCPUs; i++) {
    console.log('FORKING ',i);
    cluster.fork();
  }

} else {
  hub.on('event', function(data) {
    // do something with `data`
  });

  // emit event to all workers
  hub.emit('event', { foo: 'bar' });
}

