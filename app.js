var mongoose = require('mongoose');
var async = require('async');
var express = require('express');
var http = require('http');
var request = require('request');
var JSONStream = require('JSONStream');
var es = require('event-stream');
var path = require('path');
var _ = require('underscore');
var app = express();

mongoose.connect('mongodb://localhost/mashape');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error'));

db.on('open', function() {
  runService();
});

var runService = function() {
  app.set('port', process.env.PORT || 5000);
  app.use(express.logger('dev'));
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({limit: '50mb'}));
  app.use(express.methodOverride());
  app.use(express.bodyParser({limit: '50mb'}));
  app.use(app.router);
  app.use(express.static(__dirname + '/dashboard'));
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', express.static(path.join(__dirname,'/dashboard')));

  var Schema = mongoose.Schema;

  var Prices = new Schema({
    price: Number,
    type: String,
    popular: Boolean,
    period: String,
    quota: Number
  });

  var mashapeAPI = new Schema({
    name: String,
    user: String,
    category: String,
    link: String,
    developers: Number,
    followers: Number,
    plans: [Prices]
  });

  var mashapeAPIModel = mongoose.model('mashapeAPI', mashapeAPI);

  var fetchAPI = function() {
    mashapeAPIModel.collection.remove(function(err) {
      if (err) {console.log(err);}
      else {
        url = "https://mashape.p.mashape.com/apis?limit=2000";
        request({
          url: url,
          method: 'get',
          agent: false,
          headers: {
            "X-Mashape-Key": "k9j7VoLQGPmshLFGjTkJ53EvwZA0p1ZNh4XjsnnMO81k5mEK39"
          }
        }, function(error, resp, body) {
          if (error) {
            console.log(error)
          } else {
            var data = JSON.parse(body);
            var apis = data.apis;
            var total = data.total;
            var docs = [];
            _.each(apis, function(api) {
              docs.push({
                user: api.user.username.toLowerCase(),
                name: api.name.toLowerCase(),
                category: api.category == null ? '' : api.category.name.toLowerCase(),
                link: 'https://mashape.com/'+api.user.username.toLowerCase().split(/[ -.]+/).join('-')+'/'+api.name.toLowerCase().split(/[ -.]+/).join('-')+'/pricing',
                followers: 0,
                developers: 0,
                plans: []
              })
            });
            mashapeAPIModel.collection.insert(docs, function(err) {
              if (err) {
                console.log(err);
              } else {
                console.log(docs.length);
                console.log("done");
              }
            });
          }
        });
      }
    });
  }

  var queryAPIinfo = function() {
    mashapeAPIModel.find({}, {}, {skip: 1210}, function(err, apis) {
      var req_options = [];
      _.each(apis, function(api) {
        req_options.push({
          link: api.link,
          id: api._id
        });
      });

      var len = req_options.length;
      _.each(req_options, function(req) {
        request({
          url: req.link,
          agent: false,
          method: 'get',
          headers: {
            'Connection': 'close'
          }
        }, function(err, res, body) {
          if (err) {
            console.log(err);
          } else {
            var regexp = /<p class="price">/g;
            var regexp1 = /<p class="time-period">/g;

            var match;
            var startPriceIndex = [];
            var endPriceIndex = [];

            while ((match = regexp.exec(body)) != null) {
              startPriceIndex.push(match.index);
            }

            while ((match = regexp1.exec(body)) != null) {
              endPriceIndex.push(match.index);
            }

            var startDevIndex = body.indexOf('<span class=number>');
            var endDevIndex = body.indexOf('<span class=title>Developer');
            var startFollowIndex = body.indexOf('class="counter number">');
            var endFollowIndex = body.indexOf('<span class=title>Follower');

            var devRaw = body.slice(startDevIndex, endDevIndex);
            var followRaw = body.slice(startFollowIndex, endFollowIndex);
            var dev = parseInt(devRaw.slice(19, devRaw.indexOf('</span>')));
            var follow = parseInt(followRaw.slice(23, followRaw.indexOf('</span>')));
            var plans = [];
            for (i=0; i<startPriceIndex.length; i++) {
              var priceRaw = body.slice(startPriceIndex[i], endPriceIndex[i]);
              plans.push(
                {price: parseFloat(priceRaw.slice(50, priceRaw.indexOf('</span></p>')))}
              );
            }

            mashapeAPIModel.collection.update(
              {_id: req.id },
              {
                $set: {
                  developers: dev,
                  followers: follow,
                  plans: plans
                }

              }, function(err) {
                len--;
                if (err) console.log(err); else console.log("done fetching. Remaining: " + len);
              }
            );

          }
        });
      });

    });
  }

  //fetchAPI();
  //queryAPIinfo();


  app.get('/api/name/:name', function(req, res) {
    mashapeAPIModel.collection.find({name: req.params.name}, function(err, apis) {
      if (err) {
        return console.log(err);
      } else {
        return res.send({
          data: apis
        });
      }
    });
  });

  app.get('/api/list', function(req, res) {
    var type = req.query.type;
    var group = req.query.group;
    var match =
      type == 'free' ?
        {total: 0}
        : (type == 'paid' ? {total: {$gt: 1}} : {});

    var group_options =
    {
      _id: '$user',
      developers: {$sum: '$developers'},
      followers: {$sum: '$followers'},
      api_count: {$sum: 1}
    };

    group_options = group == 'users' ? group_options : {};

    var pipeline = [
      {$unwind: "$plans"},
      {$group: {
        _id: "$_id",
        developers: {$first: "$developers"},
        followers: {$first: "$followers"},
        user: {$first: "$user"},
        name: {$first: "$name"},
        category: {$first: "$category"},
        total: {$sum: "$plans.price"},
        plans_count: {$sum: 1},
        plans: {$addToSet: "$plans.price"}
      }},
      {$match: match}
    ];

    if (group == 'users') pipeline.push({$group: group_options});
    mashapeAPIModel.collection.aggregate(
    pipeline,
    function(err, apis) {
      if (err) {
        return console.log(err);
      } else {
        return res.send({
          data: apis
        })
      }
    });
  });

  app.listen(5000);
}
