define(['jquery','underscore','backbone', 'bootstrap','views/dashboard', 'views/admin', 'views/review', 'views/collab', 'views/pricing'],
	function($,_,Backbone, boostrap, dashboardView, adminView, reviewView, collabView, pricingView) {
		var AppRouter = Backbone.Router.extend({
			routes: {
				//albums/123?track_period=20&campaign=a,b,c&accept=&brand=&other=
				"review": "reviewAPI",
				"admin": "adminAPI",
				"pricing": "pricingAPI",
				"collabs": "collabAPI",
				"": "defaultAction"
			}

		});

		var feedbackHandler = function() {
			var timeoutID;

			function setup() {
			    this.addEventListener("mousemove", resetTimer, false);
			    this.addEventListener("mousedown", resetTimer, false);
			    this.addEventListener("keypress", resetTimer, false);
			    this.addEventListener("DOMMouseScroll", resetTimer, false);
			    this.addEventListener("mousewheel", resetTimer, false);
			    this.addEventListener("touchmove", resetTimer, false);
			    this.addEventListener("MSPointerMove", resetTimer, false);

			    startTimer();
			}
			setup();

			function startTimer() {
			    // wait 2 seconds before calling goInactive
			    timeoutID = window.setTimeout(goInactive, 60000);
			}

			function resetTimer(e) {
			    window.clearTimeout(timeoutID);
			    goActive();
			}

			function goInactive() {
			    // do something
			    $('#feedback-modal').modal({show: true});
			}

			function goActive() {
			    // do something

			    startTimer();
			}
		}

		var initialize = function() {
			var app_router = new AppRouter();

			app_router.on("route:reviewAPI", function() {
				var view = new reviewView({});
				feedbackHandler();
			});

			app_router.on("route:pricingAPI", function() {
				var view = new pricingView({});
			});

			app_router.on("route:adminAPI", function() {
				var view = new adminView({});
			});

			app_router.on("route:collabAPI", function() {
				var view = new collabView({});
			});

			app_router.on("route:defaultAction", function(actions) {
				var view = new dashboardView({});
				console.log("adotjoaidtj")
			});

			Backbone.history.start();
		}

		return {initialize:initialize};
	});
