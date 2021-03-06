/**
 * Created by konrad.sobon on 2018-03-13.
 */
angular.module('MissionControlApp').directive('d3LineBrushedDots', ['d3', function(d3) {
    return {
        restrict: 'E',
        scope: {
            data: '=',
            excluded: '=',
            domainY: '=', //Y
            callbackMethod: '&formatValue'
        },
        link: function(scope, ele) {
            var svg = d3.select(ele[0])
                .append('svg')
                .attr('width', '100%');

            // on window resize, re-render d3 canvas
            window.onresize = function() {
                return scope.$apply();
            };
            scope.$watch(function(){
                    return angular.element(window)[0].innerWidth;
                }, function(){
                    return scope.render(scope.data);
                }
            );

            // watch for data changes and re-render
            scope.$watch('data', function(data) {
                return scope.render(data);
            }, true);

            // define render function
            scope.render = function(data){
                if(!data) return;

                // remove all previous items before render
                svg.selectAll('*').remove();

                // setup variables
                var margin = {top: 30, right: 40, bottom: 110, left: 65},
                    margin2 = {top: 330, right: 40, bottom: 30, left: 65},
                    width = d3.select(ele[0])._groups[0][0].offsetWidth - margin.left - margin.right,
                    height = 400 - margin.top - margin.bottom,
                    height2 = 400 - margin2.top - margin2.bottom;

                // set the height based on the calculations above
                svg.attr('height', height + margin.top + margin.bottom);

                var parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');
                var dateFormat = d3.timeFormat('%d %b,%H:%M');

                var domainMax = 0;
                data.forEach(function(d) {
                    d.date = parseDate(d.createdOn);
                    d.value = +d.value;
                    domainMax = d.value > domainMax ? d.value : domainMax;
                });

                /*
                 (Konrad) Data that falls over certain limit is excluded from main
                 "data" array. We display that on a chart as a "dot" with tooltip.
                 It helps avoiding data points that have exaggerated scale values.
                 */
                scope.excluded.forEach(function (d) {
                    d.date = parseDate(d.createdOn);
                });

                var x = d3.scaleTime().range([0, width]),
                    x2 = d3.scaleTime().range([0, width]),
                    y = d3.scaleLinear().range([height, 1]),
                    y2 = d3.scaleLinear().range([height2, 1]);

                x.domain(d3.extent(data, function(d) { return d.date; }));
                if(scope.domainY){
                    y.domain([0, scope.domainY]);
                } else {
                    y.domain([0, domainMax]);
                }
                x2.domain(x.domain());
                y2.domain(y.domain());

                var ticksNum = 10;
                var yAxisTicks = [];
                var yDomain;
                if(scope.domainY){
                    yDomain = [0, scope.domainY];
                } else {
                    yDomain = [0, domainMax];
                }
                for (var i = 0; i < ticksNum; i++ ){
                    yAxisTicks.push((yDomain[1] - yDomain[0]) / (ticksNum - 1)* i + yDomain[0]);
                }

                var xAxis = d3.axisBottom(x).ticks(5).tickFormat(dateFormat),
                    xAxis2 = d3.axisBottom(x2).ticks(5).tickFormat(dateFormat),
                    yAxis = d3.axisLeft(y).tickValues(yAxisTicks).tickFormat(function(d){
                        return scope.callbackMethod({item: d});
                    });

                var brush = d3.brushX()
                    .extent([[0, 0], [width, height2]])
                    .on('brush end', brushed);

                var zoom = d3.zoom()
                    .scaleExtent([1, Infinity])
                    .translateExtent([[0, 0], [width, height]])
                    .extent([[0, 0], [width, height]])
                    .on('zoom', zoomed);

                var line = d3.line()
                    .curve(d3.curveLinear)
                    .x(function(d) { return x(d.date); })
                    .y(function(d) { return y(d.value); });

                var line2 = d3.line()
                    .curve(d3.curveLinear)
                    .x(function(d) { return x2(d.date); })
                    .y(function(d) { return y2(d.value); });

                var id = guid();

                svg.append('defs').append('clipPath')
                    .attr('id', id)
                    .append('rect')
                    .attr('width', width)
                    .attr('height', height);

                var focus = svg.append('g')
                    .attr('class', 'focus')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                var context = svg.append('g')
                    .attr('class', 'context')
                    .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

                focus.append('path')
                    .datum(data)
                    .attr('class', 'line')
                    .attr('clip-path', 'url(#' + id + ')')
                    .attr('d', line);

                focus.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height + ')')
                    .call(xAxis);

                focus.append('g')
                    .attr('class', 'y axis')
                    .call(yAxis);

                // Add red dots/tooltips for "excluded" data;
                var dotTooltip = svg.append('g')
                    .attr('class', 'focus')
                    .style('display', 'none');

                dotTooltip.append('text')
                    .attr('class', 'y1')
                    .attr('transform', 'translate(0, -7)')
                    .attr('text-anchor', 'middle');

                dotTooltip.append('text')
                    .attr('class', 'y2')
                    .attr('transform', 'translate(0, -20)')
                    .attr('text-anchor', 'middle');

                focus.selectAll('circle')
                    .data(scope.excluded)
                    .enter()
                    .append('circle')
                    .attr('class', 'dot')
                    .attr('r', 5)
                    .attr('cx', function (d) { return x(d.date); })
                    .attr('cy', -10)
                    .on('mouseover', function(d) {
                        dotTooltip.style('display', null);
                        dotTooltip.attr('transform', 'translate(' + (x(d.date) + margin.left) + ',55)');
                        dotTooltip.select('text.y1').text(scope.callbackMethod({item: d.value}));
                        dotTooltip.select('text.y2').text(d.user);
                    })
                    .on('mouseout', function() {
                        dotTooltip.style('display', 'none');
                    });

                // Add brushing area below chart.
                context.append('path')
                    .datum(data)
                    .attr('class', 'line')
                    .attr('d', line2);

                context.append('g')
                    .attr('class', 'x axis')
                    .attr('transform', 'translate(0,' + height2 + ')')
                    .call(xAxis2);

                context.append('g')
                    .attr('class', 'brush')
                    .call(brush)
                    .call(brush.move, x.range());

                // Add tooltips to the main chart.
                var tooltip = svg.append('g')
                    .attr('class', 'focus')
                    .style('display', 'none');

                tooltip.append('line')
                    .attr('class', 'mouse-line')
                    .attr('y1', 0)
                    .attr('y2', height);

                tooltip.append('circle')
                    .attr('r', 5)
                    .attr('fill', 'steelblue')
                    .attr('stroke-width', '1px');

                tooltip.append('text')
                    .attr('class', 'y1')
                    .attr('transform', 'translate(0, -7)')
                    .attr('text-anchor', 'middle');

                tooltip.append('text')
                    .attr('class', 'y2')
                    .attr('transform', 'translate(0, -20)')
                    .attr('text-anchor', 'middle');

                svg.append('rect')
                    .attr('class', 'zoom')
                    .attr('width', width)
                    .attr('height', height)
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                    .call(zoom)
                    .on('mouseover', function() { tooltip.style('display', null); })
                    .on('mouseout', function() { tooltip.style('display', 'none'); })
                    .on('mousemove', mousemove);

                var bisectDate = d3.bisector(function(d) { return d.date; }).left;

                /**
                 * Handles mouse move event for the tooltip.
                 */
                function mousemove() {
                    var x0 = x.invert(d3.mouse(this)[0]),
                        i = bisectDate(data, x0, 1),
                        d0 = data[i - 1],
                        d1 = data[i];
                    if(!d1) return;
                    var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                    tooltip.attr('transform', 'translate(' + (x(d.date) + margin.left) + ',' + (y(d.value) + margin.top) + ')');
                    tooltip.select('text.y1').text(scope.callbackMethod({item: d.value}));
                    tooltip.select('text.y2').text(d.user);
                    tooltip.select('.mouse-line').attr('y2', height - y(d.value));
                }

                /**
                 * Handles brushing event resetting line, dots and x-axis.
                 */
                function brushed() {
                    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
                    var s = d3.event.selection || x2.range();
                    x.domain(s.map(x2.invert, x2));
                    focus.select('.line').attr('d', line);
                    focus.selectAll('.dot').attr('cx', function (d) { return x(d.date); });
                    focus.select('.x.axis').call(xAxis);
                    svg.select('.zoom').call(zoom.transform, d3.zoomIdentity
                        .scale(width / (s[1] - s[0]))
                        .translate(-s[0], 0));
                }

                /**
                 * Handles brushing event resetting line, dots and x-axis.
                 */
                function zoomed() {
                    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
                    var t = d3.event.transform;
                    x.domain(t.rescaleX(x2).domain());
                    focus.select('.line').attr('d', line);
                    focus.selectAll('.dot').attr('cx', function (d) { return x(d.date); });
                    focus.select('.x.axis').call(xAxis);
                    context.select('.brush').call(brush.move, x.range().map(t.invertX, t));
                }

                /**
                 * Generates a unique Id for each chart brush rectangle.
                 * @returns {string}
                 */
                function guid() {
                    function s4() {
                        return Math.floor((1 + Math.random()) * 0x10000)
                            .toString(16)
                            .substring(1);
                    }
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
                }
            };
        }
    };
}]);
