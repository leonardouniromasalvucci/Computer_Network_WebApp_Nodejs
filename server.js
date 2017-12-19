var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var amqp = require('amqplib/callback_api');

app.use(session({ secret: "secret_key", saveUninitialized:false, resave:false}));

app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

class User {
  constructor(name,email,birthday){
       this.name = name;
       this.email = email;
       this.birthday = birthday;
  }
}
var conn;
amqp.connect('amqp://172.17.0.3',function(err, newconn){
  conn=newconn;
});

app.get('/',function(req,res){
	if(req.session.name) {
	    res.redirect('/admin');
	}else {
	    res.render('index.html');
	}
});

app.post('/login_form',function(req,res){
	req.session.name = req.body.name;
	req.session.email = req.body.email;
	req.session.data = req.body.birthday;
	req.session.ids = "100000829731850";
	setTimeout(function(){
        conn.createChannel(function(err, ch) {
        var ex = 'topic_lg';
        ch.assertExchange(ex, 'topic', {durable: false});
        ch.publish(ex, 'database', new Buffer(JSON.stringify(new User(req.body.name,req.body.email,req.body.data))));
        ch.publish(ex, 'logtxt', new Buffer(req.body.email));
        setTimeout(function() { ch.close(); }, 200);
        });
  }, 200);
  res.redirect('/admin');
});

app.get('/login_facebook',function(req,res){
    res.redirect('https://www.facebook.com/v2.10/dialog/oauth?client_id='+YourClientId+'&scope=email,user_birthday&response_type=code&redirect_uri=http://172.17.0.2:3000/get_codice'); 
});

app.get('/get_codice',function(req,res){
	var rx = res;
    if (req.query.error){
      rx.send("Errore " + req.query.error);
    }
    if (!req.query.code){
      rx.send("Error get code");
    }
    request.get('https://graph.facebook.com/v2.11/oauth/access_token?client_id='+YourClientId+'&code='+req.query.code+'&redirect_uri=http://172.17.0.2:3000/get_codice&client_secret='+YourClientSecret, function (err, res, body) {
        if(err){
          rx.send("Errore nell'acquisizione dell'access token!");
        }
        token = JSON.parse(body).access_token;

        request.get("https://graph.facebook.com/me?fields=id,name,birthday,email&access_token="+token, function (err, res, body2) {
        	if(err){
              rx.send("Errore nell'acquisizione deli dati!");
            }
        	var result = JSON.parse(body2);
        	  req.session.ids = result.id;
            req.session.name = result.name;
            req.session.email = result.email;
            req.session.data = result.birthday;
            req.session.token = token;
            setTimeout(function(){
              conn.createChannel(function(err, ch) {
                var ex = 'topic_lg';
                ch.assertExchange(ex, 'topic', {durable: false});
                ch.publish(ex, 'database', new Buffer(JSON.stringify(new User(result.name,result.email,result.birthday))));
                ch.publish(ex, 'logtxt', new Buffer(result.email));
                setTimeout(function() { ch.close(); }, 200);
              });
            }, 200);
            rx.redirect('/admin');
        });
    });
});

app.get('/admin',function(req,res){
    if(req.session.name) {
		res.render('login.html',  {id: req.session.ids, email: req.session.email, name: req.session.name, data: req.session.data});
	} else {
		res.write('<h1>Ops, devi effettuare il login!!!</h1>');
		res.write('<a href="/">Login</a>');
		res.end();
	}
});

app.get('/logout',function(req,res){
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
			res.redirect('/');
		}
	});
});

var connectCounter=0;

io.sockets.on('connect', function(socket){
    connectCounter++;
    console.log("connected: %s", socket.id );

    socket.emit('get users', connectCounter);
    socket.broadcast.emit('get users', connectCounter);

    socket.on('disconnect', function(data){
      console.log('Disconnected: %s' ,socket.id);
      connectCounter--; 
      
      socket.emit('disconnect users', connectCounter);
      socket.broadcast.emit('disconnect users', connectCounter);
    });

    socket.on('messageChat', function(data){
      socket.emit('writeMessageM', data);
      socket.broadcast.emit('writeMessageB', data);
    });
});

/* START DRIVE*/
var client_id = 'YourClientId';
var client_secret = 'YourClientSecret';
var scope = 'https://www.googleapis.com/auth/drive'; 

app.get('/drive_file',function(req,res){
	res.redirect('https://accounts.google.com/o/oauth2/auth?client_id='+client_id+'&response_type=code&redirect_uri=http://172.17.0.2.xip.io:3000/oauthcallback&scope='+scope+'&access_type=online');
});

app.get('/oauthcallback', function(req, res){
	  var rx = res;
    if (req.query.error){
      rx.send("Errore " + req.query.error);
    }
    if (!req.query.code){
      rx.send("Error get code");
    }
    var code = req.query.code;
    request.post('https://www.googleapis.com:443/oauth2/v4/token?code='+code+'&client_id='+client_id+'&client_secret='+client_secret+'&redirect_uri=http://172.17.0.2.xip.io:3000/oauthcallback&grant_type=authorization_code', function (err, res, body) {
        var result = JSON.parse(body);
        req.session.token = result.access_token;
        rx.redirect('/drive');
    });
});

app.get('/drive',function(req,res){
	if(req.session.token){
		  res.render('drive.html',  {token: req.session.token});
    }else{
    	res.write('<h1>Ops, devi effettuare il login!!!</h1>');
		res.write('<a href="/">Login</a>');
		res.end();
    }	
});

var PORT = 3000;
server.listen(PORT);
console.log("Server in ascolto sulla porta " + PORT);
