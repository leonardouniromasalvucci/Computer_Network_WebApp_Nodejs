var amqp = require('amqplib/callback_api');
var couch = require('couch-db'),
server = couch('http://172.17.0.4:5984');
var bodyParser = require('body-parser');
var request = require('request');

var db = server.database('test2');

amqp.connect('amqp://172.17.0.3', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var ex = 'topic_lg';

    ch.assertExchange(ex, 'topic', {durable: false});

    ch.assertQueue('', {exclusive: true}, function(err, q) {
      console.log(' [*] In attesa di messaggi. Per uscire CTRL+C');
      ch.bindQueue(q.queue, ex, 'database');
     
      ch.consume(q.queue, function(msg) {
        var r = msg;            
        request.get('http://172.17.0.4:5984/test2/_all_docs?include_docs=true' , function (err, res, body2) {
            var res = JSON.parse(r.content);
            var places = JSON.parse(body2);
            var array = [];
            places.rows.forEach(function(element) {
              array.push(element.doc.name);
            });
            if(!array.includes(res.name)){
              db.insert({ name: res.name, email: res.email, birthday: res.birthday }, function(err, body) {
                if (err) {
                  console.log('Inserimento fallito!!!', err.message);
                  return;
                }
                console.log("Utente inserito correttamente!");
              });
            }else{
                 console.log("Utente già presente nel database!");
            }
        });

      }, {noAck: true});
    });
  });
});


/*
db.destroy(function(err) {
  db.create(function(err) {
  });
});
*/