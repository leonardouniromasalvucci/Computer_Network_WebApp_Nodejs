var amqp = require('amqplib/callback_api');
var couch = require('couch-db');
var fs = require('fs'); // write to file 

amqp.connect('amqp://172.17.0.3', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var ex = 'topic_lg';

    ch.assertExchange(ex, 'topic', {durable: false});

    ch.assertQueue('', {exclusive: true}, function(err, q) {
      console.log(' [*] In attesa di messaggi. Per uscire CTRL+C');
      ch.bindQueue(q.queue, ex, 'logtxt');
     
      ch.consume(q.queue, function(msg) {
       	var date = new Date(); 
        fs.appendFile("log.txt", date.toJSON().slice(0,19).replace('T',':')+"  "+msg.content.toString()+"\n", function(err) {
          if(err) { 
             return console.log(err); 
          }
          console.log("Scrittura su file completata correttamente!");
        }); 
      }, {noAck: true});
    });
  });
});

