define(['jquery','underscore','backbone','views/dashboard'],
	function($,_,Backbone,dashboardView) {
		var AppRouter = Backbone.Router.extend({
			routes: {
				//albums/123?track_period=20&campaign=a,b,c&accept=&brand=&other=
				"*actions": "defaultAction"
			}

		});

		var initialize = function() {
			var app_router = new AppRouter();

			app_router.on("route:defaultAction", function(actions) {
				var view = new dashboardView({});
			});
			Backbone.history.start();
		}

		return {initialize:initialize};
	});
