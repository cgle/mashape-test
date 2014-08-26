define(['jquery','underscore','backbone','views/dashboard', 'views/admin', 'views/review'],
	function($,_,Backbone,dashboardView, adminView, reviewView) {
		var AppRouter = Backbone.Router.extend({
			routes: {
				//albums/123?track_period=20&campaign=a,b,c&accept=&brand=&other=
				"review": "reviewAPI",
				"admin": "adminAPI",
				"": "defaultAction"
			}

		});

		var initialize = function() {
			var app_router = new AppRouter();

			app_router.on("route:reviewAPI", function() {
				var view = new reviewView({});
			});

			app_router.on("route:adminAPI", function() {
				var view = new adminView({});
			});

			app_router.on("route:defaultAction", function(actions) {
				var view = new dashboardView({});
			});
			Backbone.history.start();
		}

		return {initialize:initialize};
	});
