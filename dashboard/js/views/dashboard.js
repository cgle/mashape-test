define(['jquery','underscore','backbone','d3','c3','dateformat','text!templates/dashboard.html'],
 function($,_,Backbone,d3,c3,dateformat,dashboardTemplate) {
  var dashboardView = Backbone.View.extend({
    el: $('#dashboard'),
    initialize: function(opts) {
      var that = this;
      $.when(
        $.get('/api/list?group=users'),
        $.get('/api/list?type=free'),
        $.get('/api/list?type=paid'),
        $.get('/api/list')
      ).done(function(users, free, paid, all) {
        that.users = users[0].data;
        that.free = free[0].data;
        that.paid = paid[0].data;
        that.all = all[0].data;
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

      var user_max_followings = _.max(this.users, function(u) {return u.followings});
      var user_max_follows = _.max(this.users, function(u) {return u.followers});
      var user_max_apis = _.max(this.users, function(u) {return u.api_count});

      var compiledtemplate = _.template(dashboardTemplate, {
        price_stats: [
          {name: 'avg price per paid public API', value: '$'+(sum_avg/that.paid.length).toFixed(2)},
          {name: 'highest avg price', value: '$'+max},
          {name: 'lowest avg price', value: '$'+min},
          {name: 'cheapest plan', value: 0},
          {name: 'most expensive plan', value: '$'+max_plan},
          {name: 'avg price per plan', value: '$'+(sum_avg/plans_total_count).toFixed(2)}
        ],
        devs_stats: [
          {name: 'paid API with most devs', value: paid_max_devs.name+' ('+paid_max_devs.value+' devs)'},
          {name: 'paid API with most followers', value: paid_max_follows.name+' ('+paid_max_follows.value+' follows)'},
          {name: 'free API with most devs', value: free_max_devs.name+' ('+free_max_devs.value+' devs)'},
          {name: 'free API with most followers', value: free_max_follows.name+' ('+free_max_follows.value+' follows)'},
          {name: 'total API publishers', value: 746},
          {name: 'publisher with most APIs', value: user_max_apis._id+' ('+user_max_apis.api_count+' APIs)'},
          {name: 'publisher with most followers', value: user_max_follows._id+' ('+user_max_follows.followers+' followers)'}
        ]
      });

      var time_apis = {};
      var time_pubs = {};
      var time_updates = {};
      var columns_time = [
        ['time-publishers'],
        ['publishers'],
        ['time-apis'],
        ['apis'],
        ['time-updates'],
        ['updates']
      ];

      var columns_updates = [
        ['time-updates'],
        ['updates']
      ];

      var columns_day_week = [
        ['days', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        ['pubs-count'],
        ['apis-count']
      ];

      var columns_month_year = [
        ['months'],
        ['pubs-count'],
        ['apis-count']
      ]

      var columns_hour_day = [
        ['hours'],
        ['pubs-count'],
        ['apis-count']
      ]

      var day_week_count = {};
      var month_year_count = {};
      var hour_day_count = {};

      _.each(that.users, function(d) {
        var account_created = (new Date(d.account_created)).format('yyyy-m');
        var month = (new Date(d.account_created)).getMonth();
        var day = (new Date(d.account_created)).getDay();
        var hour = (new Date(d.account_created)).getHours();

        if (time_pubs[account_created] == undefined) {
          time_pubs[account_created] = 0;
        }

        if (day_week_count[day] == undefined) day_week_count[day] = {pubs: 0, apis: 0};
        if (month_year_count[month] == undefined) month_year_count[month] = {pubs: 0, apis: 0};
        if (hour_day_count[hour] == undefined) hour_day_count[hour] = {pubs: 0, apis: 0};
        day_week_count[day].pubs++;
        month_year_count[month].pubs++;
        hour_day_count[hour].pubs++;

        time_pubs[account_created]++;
      });



      _.each(that.all, function(d) {
        var createDate = (new Date(d.createDate)).format('yyyy-m');
        var updateDate = (new Date(d.updateDate)).format('yyyy-m');
        var month = (new Date(d.createDate)).getMonth();
        var day = (new Date(d.createDate)).getDay();
        var hour = (new Date(d.createDate)).getHours();
        if (time_apis[createDate] == undefined) {
          time_apis[createDate] = 0;
        }

        if (time_updates[updateDate] == undefined) {
          time_updates[updateDate] = 0;
        }

        if (day_week_count[day] == undefined) day_week_count[day] = {pubs: 0, apis: 0};
        if (month_year_count[month] == undefined) month_year_count[month] = {pubs: 0, apis: 0};
        if (hour_day_count[hour] == undefined) hour_day_count[hour] = {pubs: 0, apis: 0};
        day_week_count[day].apis++;
        month_year_count[month].apis++;
        hour_day_count[hour].apis++;
        time_apis[createDate]++;
        time_updates[updateDate]++;
      });

      _.each(time_apis, function(count, time) {
        columns_time[2].push(time);
        columns_time[3].push(count);
      });

      _.each(time_pubs, function(count, time) {
        columns_time[0].push(time);
        columns_time[1].push(count);
      });

      _.each(time_updates, function(count, time) {
        columns_updates[0].push(time);
        columns_updates[1].push(count);
      });

      _.each(day_week_count, function(count, day) {
        columns_day_week[1][parseInt(day)+1] = count.pubs;
        columns_day_week[2][parseInt(day)+1] = count.apis;
      });

      _.each(month_year_count, function(count, month) {
        columns_month_year[0].push(parseInt(month)+1);
        columns_month_year[1].push(count.pubs);
        columns_month_year[2].push(count.apis);
      });

      _.each(hour_day_count, function(count, hour) {
        columns_hour_day[0].push(parseInt(hour));
        columns_hour_day[1].push(count.pubs);
        columns_hour_day[2].push(count.apis);
      });


      var paid_timecount = {};
      var free_timecount = {};

      _.each(that.paid, function(d) {
        var createDate = Date.parse((new Date(d.createDate)).format('yyyy-m'));
        if (paid_timecount[createDate] == undefined) paid_timecount[createDate] = 0;
        paid_timecount[createDate]++;
      });

      _.each(that.free, function(d) {
        var createDate = Date.parse((new Date(d.createDate)).format('yyyy-m'));
        if (free_timecount[createDate] == undefined) free_timecount[createDate] = 0;
        free_timecount[createDate]++;
      });

      var paid_t = [];
      var free_t = [];
      _.each(paid_timecount, function(c,t) {
        paid_t.push({time: t, count: c});
      });

      _.each(free_timecount, function(c,t) {
        free_t.push({time: t, count: c});
      });

      paid_t = _.sortBy(paid_t, function(t) {return t.time});
      free_t = _.sortBy(free_t, function(t) {return t.time});

      var paid_growth = [];
      var free_growth = [];
      for (i=1; i<paid_t.length; i++) {
        var m = (new Date(parseInt(paid_t[i].time) + 10*1000*60*60)).format('yyyy-m');
        var m_prev = (new Date(parseInt(paid_t[i-1].time))).format('yyyy-m');
        var ped = (parseInt(m.slice(5))) - (parseInt(m_prev.slice(5)));
        ped = ped >= 0 ? ped : 12+ped;
        paid_growth.push({month: m, count: paid_t[i].count, growth: (Math.pow(paid_t[i].count/paid_t[i-1].count,1/ped)-1)*100});
      }

      for (i=1; i<free_t.length; i++) {
        var m = (new Date(parseInt(free_t[i].time) + 10*1000*60*60)).format('yyyy-m');
        var m_prev = (new Date(parseInt(free_t[i-1].time))).format('yyyy-m');
        var ped = (parseInt(m.slice(5))) - (parseInt(m_prev.slice(5)));
        ped = ped >= 0 ? ped : 12+ped;
        free_growth.push({month: m, count: free_t[i].count, growth: (Math.pow(free_t[i].count/free_t[i-1].count,1/ped)-1)*100});
      }

      var columns_growth = [
        ['time_paid'],
        ['growth_paid'],
        ['time_free'],
        ['growth_free']
      ];

      _.each(free_growth, function(c) {
        columns_growth[2].push(c.month);
        columns_growth[3].push(c.growth);
      });

      _.each(paid_growth, function(c) {
        columns_growth[0].push(c.month);
        columns_growth[1].push(c.growth);
      });

      this.$el.html(compiledtemplate);
      this.graphLine('price-followers-chart', 0, columns_follow);
      this.graphLine('price-devs-chart', 1, columns_devs);
      this.graphDistribution(columns);
      this.graphAPIPubTime(columns_time);
      this.graphGrowth(columns_growth);
      this.graphPie();
      this.graphChart('days-week-chart', 0, columns_day_week, {'pubs-count': 'bar', 'apis-count': 'spline'}, 'days');
      this.graphChart('months-year-chart', 1, columns_month_year, {'pubs-count': 'bar', 'apis-count': 'spline'}, 'months');
      this.graphChart('hours-day-chart', 1, columns_hour_day, {'pubs-count': 'bar', 'apis-count': 'spline'}, 'hours');
    },
    graphPie: function() {
      var chart = c3.generate({
        bindto: '#free-v-paid-chart',
        size: {
          height: 360
        },
        data: {
          columns: [
            ['free', 952],
            ['paid', 205],
            ['N/A', 65]
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
    },
    graphAPIPubTime: function(columns) {
      var chart = c3.generate({
        bindto: '#apis-pubs-over-time',
        size: {
          height: 400
        },
        data: {
          x_format: '%Y-%m',
          columns: columns,
          xs: {
            'publishers': 'time-publishers',
            'apis': 'time-apis',
          },
          types: {
            'publishers': 'bar',
            'apis': 'spline',
          },
          axes: {
            apis: 'y2',
            publishers: 'y',
          }
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
                format: '%Y-%m'
            }
          },
          y2: {
            label: 'apis',
            show: true
          },
          y: {
            label: 'publishers'
          }
        },
        color: {
          pattern: ['#79d4f2','#6ca1b6','#4ac327','#FE2E2E']
        }
      });
    },
    graphChart: function(container, color, columns, types, x) {
      var colors = ['#8cc1db','#4ac327','#FE2E2E'];
      var graph = c3.generate({
        bindto: '#'+container,
        size: {
          height: 360
        },
        data: {
          x: x,
          columns: columns,
          type: 'bar',
          types: types,
          axes: {
            'apis-count': 'y2'
          }
        },
        axis: {
          x: {
            type: 'category'
          },
          y2: {
            label: 'apis',
            show: true
          },
          y: {
            label: 'publishers'
          }
        },
        color: {
          pattern: colors
        }
      });
    },
    graphGrowth: function(columns) {
      var chart = c3.generate({
        bindto: '#growth-over-time',
        data: {
          columns: columns,
          x_format: '%Y-%m',
          xs: {
            growth_paid: 'time_paid',
            growth_free: 'time_free'
          },
          type: 'spline'
        },
        axis: {
          x: {
            type: 'timeseries',
            tick: {
                format: '%Y-%m'
            }
          },
          y: {
            label: '%'
          }

        }
      });
    }

  });

  return dashboardView;
});
