define(['jquery','underscore','backbone', 'd3', 'c3', 'text!templates/mashape-view.html','text!templates/mashape-heading.html', 'text!templates/mashape-tabs.html', 'text!templates/mashape-content-header.html', 'text!templates/mashape-sidebar.html','text!templates/collab-content.html'],
  function($, _, Backbone, d3, c3, mashapeTemplate, headingTemplate, tabsTemplate, contentHeaderTemplate, contentSidebarTemplate, collabTemplate) {
    var collabView = Backbone.View.extend({
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
        var compiledContent = _.template(collabTemplate);
        this.$el.html(compiledtemplate);
        $('.header').html(compiledheading);
        $('.head').html(compiledcontentHeader);
        $('.sidebar').html(compiledSidebar);
        $('.tabs').html(compiledtabs);
        $('.inner-content').html(compiledContent);
        $('#invite-dev').on('click', function() {
          $('#developers .modal-body').append(
            '<div class="account-row">\
              <div>\
                <img src="https://www.gravatar.com/avatar/5fcb495e4510022cd8c0a2ed0efc09ba?d=retro&amp;r=pg&amp;s=50" class="pull-left img-circle">\
                <a href="/jwatanabe7" class="name">'+$('#inputAddDev').val()+'</a>\
              </div>\
              <div class="follow">\
                <button class="btn btn-success follow">Follow</button>\
              </div>\
            </div>'
            );
        });

        $(window).scroll(function(){
          var fromTop = $(window).scrollTop();
          var margin = _.max([280-fromTop, 50]);
          $(".sidebar").css('margin-top', margin + 'px');
        });
      },
    });

    return collabView;
});
