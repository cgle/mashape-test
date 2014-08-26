define(['jquery','underscore','backbone','text!templates/mashape-view.html','text!templates/mashape-heading.html', 'text!templates/mashape-tabs.html', 'text!templates/mashape-content-header.html', 'text!templates/mashape-sidebar.html', 'text!templates/reviews-content.html'],
  function($, _, Backbone, mashapeTemplate, headingTemplate, tabsTemplate, contentHeaderTemplate, contentSidebarTemplate, reviewsTemplate) {
    var reviewView = Backbone.View.extend({
      el: $('#dashboard'),
      initialize: function() {
        this.render();
      },
      render: function() {
        this.generateReviews();
        var compiledtemplate = _.template(mashapeTemplate);
        var compiledheading = _.template(headingTemplate);
        var compiledtabs = _.template(tabsTemplate);
        var compiledcontentHeader = _.template(contentHeaderTemplate);
        var compiledSidebar = _.template(contentSidebarTemplate);
        var compiledReviews = _.template(reviewsTemplate, {
          reviews: this.reviews,
          stats: this.stats
        });
        this.$el.html(compiledtemplate);
        $('.header').html(compiledheading);
        $('.head').html(compiledcontentHeader);
        $('.sidebar').html(compiledSidebar);
        $('.tabs').html(compiledtabs);
        $('.inner-content').html(compiledReviews);
        $(window).scroll(function(){
          var fromTop = $(window).scrollTop();
          var margin = _.max([280-fromTop, 50]);
          $(".sidebar").css('margin-top', margin + 'px');
        });
      },
      generateReviews: function() {
        var widths=['22','44','66','88','110']
        var titles = [
          'Response time too long',
          'Interesting API',
          'There are bugs',
          'Great API',
          'Awesome API, save us tons of time!'
        ];
        var contents = [
          'average response time is >3s per request, too long!',
          'Good concept, need more polishment',
          'Overall good, but there are bugs here and there',
          'Fast responses',
          'Awesome, good pricing!'
        ];
        this.reviews = [];
        this.stats = {
          five: 0,
          four: 0,
          three: 0,
          two: 0,
          one: 0
        }
        var stars = ['one','two','three','four','five'];
        for (i=0; i< 20; i++) {
          var ind = Math.floor((Math.random() * 5));
          this.stats[stars[ind]]++;
          this.reviews.push({
            title: titles[ind],
            width: widths[ind],
            content: contents[ind]
          });
        }
      }
    });

    return reviewView;
});
