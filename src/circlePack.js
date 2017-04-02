import * as d3 from "d3";
import { transitionTime } from "./config";

var svg, data, g, diameter;
var margin = 20;

var color = d3.scaleLinear()
  .domain([-1, 5])
  .range(["hsl(25,70%,40%)", "hsl(25,50%,10%)"])
  .interpolate(d3.interpolateHcl);

export function initialize(svgg, hierarchy){
  svg = svgg;
  data = hierarchy.sort(function(a, b) { return b.value - a.value; });

  var width = +svg.attr("width");
  var height = +svg.attr("height");
  diameter = +Math.min(width, height);

  g = svg.append("g").attr('id', 'pack').attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  updatePack();
}

export function updatePack(){

  //Create tree layout
  var pack = d3.pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

  //Put data into layout.
  var root = pack(data);

  var focus = root,
    nodes = pack(root).descendants(),
    view;

  var circle = g.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
    .style("fill", function(d) { return d.children ? color(d.depth) : null; })
    .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  var text = g.selectAll("text")
    .data(nodes)
    .enter().append("text")
    .attr("class", "label")
    .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
    .style("display", function(d) { return d.parent === root ? "inline" : "none"; })
    .text(function(d) {
      if(d.data.dependency){
        return d.data.dependency.project_name;
      }
    });

  var node = g.selectAll("circle,text");

  svg
    .on("click", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;

    var transition = d3.transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween("zoom", function(d) {
        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
        return function(t) { zoomTo(i(t)); };
      });

    transition.selectAll("text")
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
      .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
      .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
}