define(['jquery','underscore','backbone', 'd3', 'c3', 'text!templates/mashape-view.html','text!templates/mashape-heading.html', 'text!templates/mashape-tabs.html', 'text!templates/mashape-content-header.html', 'text!templates/mashape-sidebar.html','text!templates/pricing-content.html', 'text!templates/box-container.html'],
  function($, _, Backbone, d3, c3, mashapeTemplate, headingTemplate, tabsTemplate, contentHeaderTemplate, contentSidebarTemplate, pricingTemplate, boxTemplate) {
    var pricingView = Backbone.View.extend({
      el: $('#dashboard'),
      initialize: function() {
        this.render();
      },
      render: function() {
        var compiledtemplate = _.template(mashapeTemplate);
        var compiledheading = _.template(headingTemplate);
        var compiledtabs = _.template(tabsTemplate);
        var compiledcontentHeader = _.template(contentHeaderTemplate);
        var compiledContent = _.template(pricingTemplate);
        this.$el.html(compiledtemplate);
        $('.header').html(compiledheading);
        $('.head').html(compiledcontentHeader);
        $('.tabs').html(compiledtabs);
        $('.inner-content').html(compiledContent);
        $('.sidebar').css('display', 'none');
        this.unsubscribeHandler();
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
      },
      unsubscribeHandler: function() {
        var that = this;
        $('#unsubscribe').on('click', function() {
          that.navigate('.pricing-container', '.pricing-questionaire');
          that.goBack('.pricing-questionaire', '.pricing-container');
          var whyUnsub = _.template(boxTemplate, {
            id: 'why-unsub',
            header: '<h2>Why do you want to unsubscribe?</h2>',
            content: "\
            <p>Let us know about the reasons you are unsubscribing: </p>\
            <ul style='list-style-type:none'>\
              <li><input type='checkbox' id='expensive'> To expensive</li>\
              <li><input type='checkbox' id='support'> No support</li>\
              <li><input type='checkbox' id='unreliable'> Unreliable</li>\
              <li><input type='checkbox' id='bad'> Bad documentation</li>\
              <li><input type='checkbox' id='somethingelse'> Something else</li>\
              <li id='why-unsub-text' style='display:none'><textarea style='width: 350px'></textarea></li>\
            </ul>",
            footer: "<a class='continue'>CONTINUE</a>\
          <button class='btn btn-success btn-sm back'>GO BACK</button>"
          });
          if (!$('#why-unsub').length) {
            $('.pricing-questionaire').append(whyUnsub);
          }
          that.goNext('#questions', '#why-unsub');
          that.questionsHandler();
        });
      },
      questionsHandler: function() {
        var that = this;
        this.goBack('#why-unsub', '#questions');
        this.$('#somethingelse').on('click', function() {
          $('#why-unsub-text').toggle();
        });
        var bye = _.template(boxTemplate, {
          id: 'bye',
          header: "<div style='border: 2px solid red; border-radius: 6px; color: red; background-color: oldlace; padding: 30px; font-weight: 600'>\
            <b>Remember that you won't be able to use this API once unsubscribing</b>\
          </div>",
          content: "<div style='background: ghostwhite; text-align: center; font-weight: 600'>\
            <div style='padding-top: 20px; padding-bottom: 20px; background: #eaf0f3'>\
              SO MANY MEMORIES\
            </div>\
            <div>\
              <ul style='list-style-type: none; line-height: 30px'>\
                <li>First time you used this API: Jan 1, 2014</li>\
                <li>Last time you used this API: May 2, 2014</li>\
                <li>API calls: 1333</li>\
                <li>Days remaining till plan expires: 20</li>\
              </ul>\
            </div>\
          </div>",
          footer: "<div class='form-group'><input type='text' style='height: 50px; padding-left: 10px; width: 350px; border: 1px solid #ddd; border-radius 3px' placeholder='Type UNSUBSCRIBE to confirm'>\
          <button class='btn btn-success btn-sm back'>I WANT TO KEEP MY PLAN</button>\
          <a class='continue'>UNSUBSCRIBE ME</a></div>"
        });
        if (!$('#bye').length) {
          $('.pricing-questionaire').append(bye);
        }
        that.goNext('#why-unsub', '#bye');
        that.byeHandler();
      },
      byeHandler: function() {
        var that = this;
        $('#bye .back').on('click', function() {
          that.navigate('.pricing-questionaire','.pricing-container');
          setTimeout(function() {
            $('#bye').hide();
            $('#questions').show();
            $('#why-unsub').hide();
          }, 200);
        });

      },
      goBack: function(container, dest) {
        var that = this;
        $(container+' .back').on('click', function() {
          that.navigate(container, dest);
        });
      },
      goNext: function(container, dest) {
        var that = this;
        $(container + ' .continue').on('click', function() {
          that.navigate(container, dest);
        });
      },
      navigate: function(current, dest) {
        $(current).fadeOut(200, function(){
          $(dest).fadeIn(200);
        });

      },

    });

    return pricingView;
});
