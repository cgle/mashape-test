define(['jquery','underscore','backbone','d3','c3','text!templates/dashboard.html'],
 function($,_,Backbone,d3,c3,dashboardTemplate) {
  var dashboardView = Backbone.View.extend({
    el: $('#dashboard'),
    initialize: function(opts) {
      var that = this;
      $.when(
        $.get('/api/list?group=users'),
        $.get('/api/list?type=free'),
        $.get('/api/list?type=paid')
      ).done(function(users, free, paid) {
        that.users = users[0].data;
        that.free = free[0].data;
        that.paid = paid[0].data;
        that.render();
      });
    },
    render: function() {

      var that = this;
      var columns = [
        ['x'], //0
        ['followers'], //1
        ['developers'], //2
        ['avgPrice'], //3
        ['api_count'] //4
      ];

      var columns_follow = [
        ['x'],
        ['price']
      ];

      var columns_devs = [
        ['x'],
        ['price']
      ];

      var category = {};
      var sum_avg = 0;
      var min = 0;
      var max = 0;
      var max_plan = 0;
      var plans_total_count = 0;

      var paid_max_devs = {user: '', value: 0};
      var paid_max_follows = {user: '', value: 0};
      var free_max_devs = {user: '', value: 0};
      var free_max_follows = {user: '', value: 0};

      _.each(that.paid, function(d) {
        var avg = d.total / d.plans_count;
        sum_avg += avg;
        plans_total_count += d.plans_count;
        min = min == 0 ? avg : (min > avg ? avg : min);
        max = max < avg ? avg : max;
        max_plan = max_plan < _.max(d.plans) ? _.max(d.plans) : max_plan;
        if (category[d.category] == undefined) {
          category[d.category] = {
            followers: 0,
            developers: 0,
            total: 0,
            plans_count: 0,
            api_count: 0
          }
        }

        if (d.developers > paid_max_devs.value) {
          paid_max_devs = {
            name: d.name,
            value: d.developers
          }
        }

        if (d.followers > paid_max_follows.value) {
          paid_max_follows = {
            name: d.name,
            value: d.followers
          }
        }


        columns_devs[0].push(d.developers);
        columns_devs[1].push(avg);
        columns_follow[0].push(d.followers);
        columns_follow[1].push(avg);

        category[d.category].followers += d.followers;
        category[d.category].developers += d.developers;
        category[d.category].total += avg;
        category[d.category].plans_count += d.plans_count;
        category[d.category].api_count ++;
      });

      _.each(this.free, function(d) {
        if (d.developers > free_max_devs.value) {
          free_max_devs = {
            name: d.name,
            value: d.developers
          }
        }

        if (d.followers > free_max_follows.value) {
          free_max_follows = {
            name: d.name,
            value: d.followers
          }
        }
      });

      _.each(category, function(v, k) {
        var c = category[k];
        c.avgPrice = c.total / c.api_count;
        columns[0].push(k);
        columns[1].push(c.followers);
        columns[2].push(c.developers);
        columns[3].push(c.avgPrice);
        columns[4].push(c.api_count);
      });

      var user_max_devs = _.max(this.users, function(u) {return u.developers});
      var user_max_follows = _.max(this.users, function(u) {return u.followers});
      var user_max_apis = _.max(this.users, function(u) {return u.api_count});

      console.log(user_max_apis);
      var compiledtemplate = _.template(dashboardTemplate, {
        price_stats: [
          {name: 'avg price per paid public API', value: (sum_avg/that.paid.length).toFixed(2)},
          {name: 'highest avg price', value: max},
          {name: 'lowest avg price', value: min},
          {name: 'cheapest plan', value: 0},
          {name: 'most expensive plan', value: max_plan},
          {name: 'avg price per plan', value: (sum_avg/plans_total_count).toFixed(2)}
        ],
        devs_stats: [
          {name: 'paid API with most devs', value: paid_max_devs.name+' ('+paid_max_devs.value+' devs)'},
          {name: 'paid API with most followers', value: paid_max_follows.name+' ('+paid_max_follows.value+' follows)'},
          {name: 'free API with most devs', value: free_max_devs.name+' ('+free_max_devs.value+' devs)'},
          {name: 'free API with most followers', value: free_max_follows.name+' ('+free_max_follows.value+' follows)'},
          {name: 'total API publishers', value: 723},
          {name: 'publishers with most APIs', value: user_max_apis._id+' ('+user_max_apis.api_count+' APIs)'},
          {name: 'publishers with most devs', value: user_max_devs._id+' ('+user_max_devs.developers+' devs)'},
          {name: 'publishers with most followers', value: user_max_follows._id+' ('+user_max_follows.followers+' follows)'}
        ]
      });
      this.$el.html(compiledtemplate);

      this.graphLine('price-followers-chart', 0, columns_follow);
      this.graphLine('price-devs-chart', 1, columns_devs);
      this.graphDistribution(columns);
      this.graphPie();
    },
    graphPie: function() {
      var chart = c3.generate({
        bindto: '#free-v-paid-chart',
        size: {
          height: 360
        },
        data: {
          columns: [
            ['free', 923],
            ['paid', 189],
            ['N/A', 109]
          ],
          type: 'pie'
        },
        color: {
          pattern: ['#87DB42','#41C3C0','#44DEBB']
        },
      });
    },
    graphLine: function(container, color, columns) {
      var colors = ['#87DB42','#41C3C0'];
      var chart = c3.generate({
        bindto: '#'+container,
        size: {
          height: 360
        },
        data: {
          x: 'x',
          columns: columns,
          type: 'scatter'
        },
        axis: {
          x: {
            tick: {
                fit: false
            }
          },
        },
        color: {
          pattern: [colors[color]]
        }

      });
    },
    graphDistribution: function(columns) {
      var that = this;
      var chart = c3.generate({
        bindto: '#distibution-chart',
        size: {
          height: 450
        },
        data: {
          x: 'x',
          columns: columns,
          type: 'bar',
          types: {
            'avgPrice': 'spline',
            'api_count': 'spline'
          },
          axes: {
            followers: 'y2',
            developers: 'y2',
            avgPrice: 'y2',
            api_count: 'y'
          }
        },
        axis: {
            x: {
                type: 'category'
            },
            y2: {
              show: true
            }
        },
        color: {
          pattern: ['#79d4f2','#6ca1b6','#4ac327','#FE2E2E']
        }
      })
    }
  });

  return dashboardView;
});
