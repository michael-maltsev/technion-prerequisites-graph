/*global jQuery, d3, dagreD3, DAG */

(function () {
    'use strict';
    window.DAG = {
        displayGraph: function (graph, svgElem) {
            this.renderGraph(graph, svgElem);
        },

        renderGraph: function(graph, svgParent) {
            var nodes = graph.nodes;
            var links = graph.links;

            var graphElem = svgParent.children('g').get(0);
            var svg = d3.select(graphElem);
            var renderer = new dagreD3.Renderer();
            var layout = dagreD3.layout().rankDir('LR');
            renderer.layout(layout).run(dagreD3.json.decode(nodes, links), svg.append('g'));

            // Adjust SVG height to content
            var main = svgParent.find('g > g');
            var h = main.get(0).getBoundingClientRect().height;
            var newHeight = h + 40;
            newHeight = newHeight < 80 ? 80 : newHeight;
            svgParent.height(newHeight);

            // Zoom
            d3.select(svgParent.get(0)).call(d3.behavior.zoom().on('zoom', function() {
                var ev = d3.event;
                svg.select('g')
                    .attr('transform', 'translate(' + ev.translate + ') scale(' + ev.scale + ')');
            }));
        }
    };
})();

(function () {
    'use strict';

	// https://stackoverflow.com/a/901144
	function getParameterByName(name, url) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	var faculty = getParameterByName('faculty') || 'מדעי המחשב';
	jQuery('select[name="faculty"]').val(faculty);

    // load data on dom ready
    jQuery(function () {
		var nodes = [];
		var links = [];
		var allCourses = {};
		courses_from_rishum.forEach(function (item) {
			var general = item['general'];
			if (general['פקולטה'] !== faculty) {
				return;
			}

			var label = general['מספר מקצוע'] + ' - ' + general['שם מקצוע'];
			var node = { id: general['מספר מקצוע'], value: { label: label } };
			nodes.push(node);

			allCourses[general['מספר מקצוע']] = true;
		});

		courses_from_rishum.forEach(function (item) {
			var general = item['general'];
			if (general['פקולטה'] !== faculty) {
				return;
			}

			var types = [
				'מקצועות קדם',
				//'מקצועות ללא זיכוי נוסף',
				'מקצועות צמודים',
				//'מקצועות ללא זיכוי נוסף (מוכלים)',
				//'מקצועות ללא זיכוי נוסף (מכילים)',
				//'מקצועות זהים'
			];
			types.forEach(function (type) {
				if (!general[type]) {
					return;
				}
				var courses = general[type].match(/\d+/g).filter(function(item, pos, self) {
					return self.indexOf(item) == pos;
				});
				courses.forEach(function (course) {
					if (!allCourses[course]) {
						return;
					}
					var label = (type == 'מקצועות צמודים') ? 'צמוד' : '';
					var link = { u: course, v: general['מספר מקצוע'], value: { label: label } };
					links.push(link);
				})
			});
		});

		var data = {nodes: nodes, links: links};

        DAG.displayGraph(data, jQuery('#dag > svg'));
    });
}());
