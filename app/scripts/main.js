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

    // load data on dom ready
    jQuery(function () {
		const currentSemester = getParameterByName('semester') || '';
		const currentFaculty = getParameterByName('faculty') || 'מדעי המחשב';

		const nodes = [];
		const links = [];
		const allFaculties = {};
		const facultyCourses = {};
		for (const item of courses_from_rishum) {
			const general = item['general'];

			if (general['פקולטה']) {
				allFaculties[general['פקולטה']] = true;
			}

			if (currentFaculty !== '-' && general['פקולטה'] !== currentFaculty) {
				continue;
			}

			const label = general['מספר מקצוע'] + ' - ' + general['שם מקצוע'];
			const node = { id: general['מספר מקצוע'], value: { label: label } };
			nodes.push(node);

			facultyCourses[general['מספר מקצוע']] = true;
		}

		jQuery('input[name="semester"]').val(currentSemester);

		const facultySelect = jQuery('select[name="faculty"]');
		for (const faculty of Object.keys(allFaculties)) {
			facultySelect.append($('<option>', {
				value: faculty,
				text: faculty
			}));
		}

		facultySelect.val(currentFaculty);

		for (const item of courses_from_rishum) {
			const general = item['general'];
			if (currentFaculty != '-' && general['פקולטה'] !== currentFaculty) {
				continue;
			}

			const types = [
				'מקצועות קדם',
				//'מקצועות ללא זיכוי נוסף',
				'מקצועות צמודים',
				//'מקצועות ללא זיכוי נוסף (מוכלים)',
				//'מקצועות ללא זיכוי נוסף (מכילים)',
				//'מקצועות זהים'
			];
			for (const type of types) {
				if (!general[type]) {
					continue;
				}
				const courses = general[type].match(/\d+/g).filter((item, pos, self) => {
					return self.indexOf(item) == pos;
				});
				for (const course of courses) {
					if (!facultyCourses[course]) {
						continue;
					}
					const label = (type == 'מקצועות צמודים') ? 'צמוד' : '';
					const link = { u: course, v: general['מספר מקצוע'], value: { label: label } };
					links.push(link);
				}
			}
		}

		const data = {nodes: nodes, links: links};

        DAG.displayGraph(data, jQuery('#dag > svg'));
    });
}());
