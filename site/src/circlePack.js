import * as d3 from "d3";
import { transitionTime } from "./config";

var svg, data, g, diameter;
var margin = 20;
var minRadiusForLabel = 40;

var color = d3.scaleLinear()
  .domain([-1, 6])
  .range(["hsl(25,70%,40%)", "hsl(25,50%,10%)"])
  .interpolate(d3.interpolateHcl);

export function initialize(svgg, hierarchy, center, radius){
  svg = svgg;

  //Parse data into a hierarchy.
  data = d3.hierarchy(hierarchy, project => {
    if(project.dependencies.length > 0){
      if( project.dependency ){
        project.dependencies.push({type: "label", dependencies: [], dependency: {project_name: project.dependency.project_name}})
      }
      return project.dependencies.filter( x => x ); //Filter out nulls (https://github.com/librariesio/libraries.io/issues/1360)
    }
  })
  .sum(function(d) { return 1; })
  //.sort(function(a, b) { return b.value - a.value; });

  diameter = radius*2;

  g = svg.append("g")
    .attr('id', 'pack')
    .attr("transform", "translate(" + center[0] + "," + center[1] + ")");

  updatePack();
}

function shouldDisplayText(node, currentZoom, currentFocus){
  //Never display text on non-leaf nodes
  if( node.children ){
    return false;
  }

  //If we are zoomed enough that this node is quite big, display it, however deep it is.
  if( node.r*currentZoom > minRadiusForLabel ){
    return true;
  }

  //Display text for the next level down (labels for the next level down are actually "2 levels down" thanks to the transparent label circle).
  if( node.depth <= currentFocus.depth + 1 || (node.data.type == "label" && node.depth <= currentFocus.depth + 2 )){
    return true;
  }

  return false;
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
    .style("fill", function(d) { return d.children ? color(d.depth) : color(d.depth + 1); })
    .style("opacity", function(d){ return d.data.type == "label" ? 0 : 1}) //Labels are transparent.
    .on("click", function(d) { if (focus !== d) zoom(d), d3.event.stopPropagation(); });

  var text = g.selectAll("text")
    .data(nodes)
    .enter().append("text")
    .attr("class", "label")
    .style("fill-opacity", function(d) { return shouldDisplayText(d, 1, focus) ? 1 : 0; })
    .style("display", function(d) { return shouldDisplayText(d, 1, focus) ? "inline" : "none"; })
    .text(function(d) {
      if(d.data.dependency){
        return d.data.dependency.project_name;
      }
    });

  var node = g.selectAll("circle,text");

  g
    .on("click", function() { zoom(root); });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus; focus = d;
    var pxToFitToWindow = focus.r * 2 + margin;
    var k = diameter / pxToFitToWindow;

    var transition = d3.transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween("zoom", function(d) {
        var i = d3.interpolateZoom(view, [focus.x, focus.y, pxToFitToWindow]);
        return function(t) { zoomTo(i(t)); };
      });

    transition.selectAll("text")
    //.filter(function(d) { return d.parent === focus || this.style.display === "inline"; }) //Only need to update currently visible or newly visible texts.
      .style("fill-opacity", function(d) { return shouldDisplayText(d, k, focus) ? 1 : 0; })
      .on("start", function(d) { if (shouldDisplayText(d, k, focus)){ this.style.display = "inline"; }})
      .on("end", function(d) { if (!shouldDisplayText(d, k, focus)){ this.style.display = "none"; }});
  }

  function zoomTo(v) {
    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }
}