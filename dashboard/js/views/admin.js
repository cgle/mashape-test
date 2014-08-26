define(['jquery','underscore','backbone', 'd3', 'c3', 'text!templates/mashape-view.html','text!templates/mashape-heading.html', 'text!templates/mashape-tabs.html', 'text!templates/mashape-content-header.html', 'text!templates/mashape-sidebar.html','text!templates/admin-content.html'],
  function($, _, Backbone, d3, c3, mashapeTemplate, headingTemplate, tabsTemplate, contentHeaderTemplate, contentSidebarTemplate, adminTemplate) {
    var adminView = Backbone.View.extend({
      el: $('#dashboard'),
      initialize: function() {
        this.render();
      },
      render: function() {
        var compiledtemplate = _.template(mashapeTemplate);
        var compiledheading = _.template(headingTemplate);
        var compiledtabs = _.template(tabsTemplate);
        var compiledcontentHeader = _.template(contentHeaderTemplate);
        var compiledSidebar = _.template(contentSidebarTemplate);
        var compiledContent = _.template(adminTemplate);
        this.$el.html(compiledtemplate);
        $('.header').html(compiledheading);
        $('.head').html(compiledcontentHeader);
        $('.sidebar').html(compiledSidebar);
        $('.tabs').html(compiledtabs);
        $('.inner-content').html(compiledContent);
        $(window).scroll(function(){
          var fromTop = $(window).scrollTop();
          var margin = _.max([280-fromTop, 50]);
          $(".sidebar").css('margin-top', margin + 'px');
        });
        this.graphPie();
        this.graphSubs();
        this.graphRequests();
        this.graphDaily();
        this.graphMonthly();
      },
      graphPie: function() {
        var chart = c3.generate({
          bindto: '#subscriptions-piechart',
          data: {
            columns: [
              ['free', 30],
              ['basic', 20],
              ['pro', 25],
              ['mega', 5]
            ],
            type: 'pie'
          },
          color: {
            pattern: ['#79d4f2','#6ca1b6','#4ac327','#8cc1db']
          }
        });
      },
      graphSubs: function() {
        columns = [
          ['subs'],
          ['followers']
        ];

        for (i=0; i<30; i++) {
          var rand1 = Math.floor((Math.random() * 50));
          var rand2 = Math.floor((Math.random() * 200));
          columns[0].push(rand1);
          columns[1].push(rand2);
        }
        var chart = c3.generate({
          bindto: '#subscriber-follower-chart',
          data: {
            columns: columns,
            types: {
              subs: 'bar',
              followers: 'spline'
            },
            axes: {
              'subs': 'y2',
              'followers': 'y'
            }
          },
          axis: {
            y2: {
              show: true
            },
            x: {
              tick: {
                count: 5
              }
            }
          },
          color: {
            pattern: ['#79d4f2','#6ca1b6','#4ac327','#8cc1db']
          }
        });
      },
      graphRequests: function() {
        var columns = [
          ['request'],
          ['error'],
          ['latency']
        ];
        for (i=0;i<45;i++) {
          var rand1 = Math.floor((Math.random() * 450)) + 300;
          var rand2 = Math.floor((Math.random() * 5));
          var rand3 = Math.floor((Math.random() * 450)) + 100;
          columns[0].push(rand3);
          columns[1].push(rand2);
          columns[2].push(rand1);
        }
        var chart = c3.generate({
          bindto: '#request-error-latency-chart',
          data: {
            columns: columns,
            axes: {
              request: 'y',
              latency: 'y',
              error: 'y2'
            },
            types: {
              request: 'bar',
              latency: 'area-spline',
              error: 'spline'
            }
          },
          axis: {
            x: {
              tick: {
                count: 12
              }
            }
          },
          color: {
            pattern: ['#6ca1b6','red','#79d4f2']
          }
        });
      },
      graphDaily: function() {
        var columns = [
          ['day','sun','mon','tue','wed','thu','fri','sat'],
          ['requests']
        ];

        for (i=0; i<7; i++) {
          var rand = Math.floor((Math.random() * 2500)) + 2000;
          columns[1].push(rand);
        }
        var chart = c3.generate({
          bindto: '#daily-chart',
          data: {
            x: 'day',
            columns: columns,
            type: 'bar'
          },
          axis: {
            x: {
              type: 'category'
            }
          },
          color: {
            pattern: ['#6ac1b6']
          }
        });
      },
      graphMonthly: function() {
        var columns = [
          ['month', 'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],
          ['requests']
        ];
        for (i=0; i<12; i++) {
          var rand = Math.floor((Math.random() * 30000)) + 20000;
          columns[1].push(rand);
        }
        var chart = c3.generate({
          bindto: '#monthly-chart',
          data: {
            x: 'month',
            columns: columns,
            type: 'bar'
          },
          axis: {
            x: {
              type: 'category'
            }
          },
          color: {
            pattern: ['#6ac1b6']
          }
        });
      }
    });

    return adminView;
});
