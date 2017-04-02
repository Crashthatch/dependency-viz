import * as d3 from "d3";
import { transitionTime } from "./config";

var svg, data, g, radius;
// Keep track of the node that is currently being displayed as the root.
var node;

var margin = 20;
var formatNumber = d3.format(",d");

var x = d3.scaleLinear()
  .range([0, 2 * Math.PI]);
var y;

var color = d3.scaleLinear()
  .domain([-1, 10])
  .range(["hsl(25,70%,40%)", "hsl(25,50%,10%)"])
  .interpolate(d3.interpolateHcl);

var partition = d3.partition();

var arc = d3.arc()
  .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
  .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
  .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
  .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

export function initialize(svgg, hierarchy){
  svg = svgg;
  data = hierarchy.sort(function(a, b) { return b.value - a.value; });

  var width = +svg.attr("width");
  var height = +svg.attr("height");
  radius = +Math.min(width, height)/2;

  y = d3.scaleSqrt()
    .range([0, radius]);

  g = svg.append("g").attr('id', 'sunburst').attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  update();
}

function click(d) {
  svg.transition()
    .duration(transitionTime)
    .tween("scale", function() {
      var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
        yd = d3.interpolate(y.domain(), [d.y0, 1]),
        yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
      return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
    })
    .selectAll("path")
    .attrTween("d", function(d) { return function() { return arc(d); }; });
}

export function update(){

  g.selectAll("path")
    .data(partition(data).descendants())
    .enter().append("path")
    .attr("d", (d) => {console.log(arc(d)); return arc(d); })
    .style("fill", function(d) { return color(d.depth); })
    .on("click", click)
    .append("title")
    .text(function(d) {
      if(d.data.dependency){
        return d.data.dependency.project_name;
      }
    });
}