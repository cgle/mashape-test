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

  var mashapeUser = new Schema({
    user: String,
    profile_picture: String
  });

  var mashapeAPI = new Schema({
    name: String,
    user: String,
    category: String,
    link: String,
    developers: Number,
    followers: Number,
    createDate: String,
    updateDate: String,
    account_created: String,
    account_followings_url: String,
    account_followers_url: String,
    account_followings: Number,
    account_followers: Number,
    url: String,
    plans: [Prices]
  });

  var mashapeAPIModel = mongoose.model('mashapeAPI', mashapeAPI);

  var fetchAPI = function() {
    mashapeAPIModel.collection.remove(function(err) {
      if (err) {console.log(err);}
      else {
        url = "https://mashape.p.mashape.com/apis?limit=3000";
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
                name: api.url.slice(api.url.indexOf('/apis')+6),
                category: api.category == null ? '' : api.category.name.toLowerCase(),
                link: 'https://mashape.com/'+api.user.username.toLowerCase().split(/[ -.]+/).join('-')+'/'+api.url.slice(api.url.indexOf('/apis')+6)+'/pricing',
                url: api.url,
                followers: 0,
                developers: 0,
                plans: []
              });
            });
            console.log(docs[0]);
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
    mashapeAPIModel.find({}, {}, {limit: 5}, function(err, apis) {
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
            var plans = [];
            while ((match = regexp.exec(body)) != null) {
              startPriceIndex.push(match.index);
            }

            while ((match = regexp1.exec(body)) != null) {
              endPriceIndex.push(match.index);
            }


            for (i=0; i<startPriceIndex.length; i++) {
              var priceRaw = body.slice(startPriceIndex[i], endPriceIndex[i]);
              plans.push(
                {price: parseFloat(priceRaw.slice(50, priceRaw.indexOf('</span></p>')))}
              );
            }

            var startJSONindex = body.indexOf("Mashape.Store('api.version').set(JSON.parse(decodeURIComponent(");
            var endJSONindex = body.length - 14;
            var api_json = startJSONindex > -1 ? JSON.parse(decodeURIComponent(body.slice(startJSONindex + 64, endJSONindex))) : {};
            var check_api = api_json.api != undefined;

            var developers = check_api ? api_json.api.developers.total : 0;
            var followers = check_api ? api_json.api.followers.total : 0;
            var createDate = check_api ? api_json.api.creationDate : "";
            var updateDate = check_api ? api_json.api.updateDate : "";
            var account_created = check_api ? api_json.api.account.creationDate : "";
            var account_followers_url = check_api ? api_json.api.account.links.accountsfollowing.href : "";
            var account_followings_url = check_api ? api_json.api.account.links.followers.href : "";

            mashapeAPIModel.collection.update(
              {_id: req.id },
              {
                $set: {
                  developers: developers,
                  followers: followers,
                  createDate: createDate,
                  updateDate: updateDate,
                  account_created: account_created,
                  account_followings_url: account_followings_url,
                  account_followers_url: account_followers_url,
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

  var queryAPIaccount = function() {
    mashapeAPIModel.find({}, {}, {}, function(err, apis) {
      if (err) console.log(err);
      else {
        _.each(apis, function(api) {

          var outputs = {};
          _.each([api.account_followings_url, api.account_followers_url], function(url) {
            if (url != '') {
              var good_url = url.indexOf('https://10.1') > -1 ?  "https://www.mashape.com"+url.slice(url.indexOf('/api/')) : url;
              request({url: good_url, method: 'get', agent: false}, function(error, res, body) {
                if (error) {console.log(error); console.log(good_url);}
                else {
                  var data = JSON.parse(body);
                  var name = url.indexOf('accountsfollowing') > -1 ? 'account_followings' : 'account_followers';
                  var value = data.total;
                  outputs[name] = value;
                  if (Object.keys(outputs).length == 2) {
                    //save
                    console.log(outputs);
                    mashapeAPIModel.collection.update(
                      {_id: api._id },
                      {
                        $set: {
                          account_followings: outputs.account_followings,
                          account_followers: outputs.account_followers
                        }
                      }, function(err) {
                        //console.log(api.name);
                        if (err) console.log(err); else console.log("done updating.");
                      }
                    );
                  }
                }
              });
            }

          });
        });
      }
    });
  }


  //fetchAPI();
  //queryAPIinfo();
  //queryAPIaccount();

  app.get('/api/name/:name', function(req, res) {
    mashapeAPIModel.find({name: req.params.name}, function(err, apis) {
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
      followers: {$first: '$account_followers'},
      followings: {$first: '$account_followings'},
      account_created: {$first: '$account_created'},
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
        createDate: {$first: "$createDate"},
        updateDate: {$first: "$updateDate"},
        account_created: {$first: "$account_created"},
        account_followers_url: {$first: "$account_followers_url"},
        account_followings_url: {$first: "$account_followings_url"},
        account_followers: {$first: "$account_followers"},
        account_followings: {$first: "$account_followings"},
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
