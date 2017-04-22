import * as d3 from "d3";
import { transitionTime } from "./config";

var data, g, levelSizePx;

function zoomed(d){
  g.attr('transform', "translate(" + d3.event.transform.x + "," + d3.event.transform.y + ")");
}

export function initialize(svg, hierarchy, center, radius){
  //Parse data into a hierarchy.
  data = d3.hierarchy(hierarchy, project => {
    if(project.dependencies.length > 0){
      return project.dependencies.filter( x => x); //Filter out nulls (Due to https://github.com/librariesio/libraries.io/issues/1360).
    }
  })
  .sum(function(d) { return 1; });

  levelSizePx = Math.max(radius / 3, 130);

  g = svg.append("g")
    .attr('id', 'tree');

  var zoom = d3.zoom()
    .scaleExtent([1,1])//Disable scaling.
    .translateExtent([[-1300, -1300], [1300, 1300]]) //This box should contain all the "visible things" that the viewport can be scrolled to see.
    .on("zoom", zoomed);

  zoom.transform(svg, d3.zoomIdentity); //Reset zoom in case it was changed before initialize() was called (eg. previous viz)
  zoom.translateBy(svg, center[0], center[1]);

  svg.call(zoom);

  updateTree();
}


function project(x, depth) {
  var angle = (x - 90) / 180 * Math.PI;
  var radius = levelSizePx*Math.max((depth-0.4),0); //Don't use y, as we don't want to stretch to fit the "1000px" size for small packages with few dependencies.
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

// Toggle children on click.
function setCollapsed(d){
  if (d.children) {
    d._children = d.children;
    d.children = null;
  }
}
function toggleCollapsed(d) {
  if (d.children) {
    setCollapsed(d);
  }
  else if(d._children) { //Expand 1 layer.
    d.children = d._children;
    d._children = null;
  }

  updateTree();
}

export function updateTree(){

  var oldLocations = new Map();
  g.selectAll('.node')
    .each( function(node){
      if( node.data.dependency ){
        oldLocations.set(node.data.dependency.id, {x: node.x, depth: node.depth});
      }
    });

  //Create radial tree layout
  let tree = d3.tree()
    .size([360, 1000])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  //Put data into tree.
  var root = tree(data);

  //Create new links and nodes
  var links = g.selectAll(".link")
    .data(root.descendants().slice(1), d => d.data.dependency.id);

  var exitLinks = links.exit().remove();

  var enterLinks = links.enter()
    .append("path")
    .attr("class", "link")
    .attr("d", function(d){
      let oldParentLocation;
      if(d.parent && d.parent.data.dependency && oldLocations.has(d.parent.data.dependency.id) ){
        oldParentLocation = oldLocations.get(d.parent.data.dependency.id);
      }
      else{
        oldParentLocation = d.parent; //Fall back to the new location of the parent.
      }
      return "M" + project(oldParentLocation.x, oldParentLocation.depth)
        + "C" + project(oldParentLocation.x, oldParentLocation.depth)
        + " " + project(oldParentLocation.x, oldParentLocation.depth)
        + " " + project(oldParentLocation.x, oldParentLocation.depth);
    });

  var allLinks = g.selectAll('.link');
  allLinks
    .transition().duration(transitionTime)
    .attr("d", function(d) {
      if(d.parent == root ){ //Straight lines in the middle.
        return "M" + project(d.x, d.depth)
          + "L" + project(d.parent.x, d.parent.depth);

      }
      return "M" + project(d.x, d.depth)
        + "C" + project(d.x, (d.depth + d.parent.depth) / 2)
        + " " + project(d.parent.x,(d.depth + d.parent.depth)/2)
        + " " + project(d.parent.x, d.parent.depth);
    });


  //Add & remove nodes:
  var nodes = g.selectAll(".node")
    .data(root.descendants(), function(d){
      if(d.data.dependency){
        return d.data.dependency.id;
      } else{
        return 0; //Root node doesn't have "dependency" key?
      }
    });

  var exitNodes = nodes.exit().remove();
  var enterNodes = nodes.enter()
    .append("g")
    .attr("class", function(d) { return "node" + (d.children || d._children ? " node--internal" : " node--leaf"); })
    .attr("transform", function(d) {
      if(d.parent && d.parent.data.dependency && oldLocations.has(d.parent.data.dependency.id)){
        let oldParentLocation = oldLocations.get(d.parent.data.dependency.id);
        return "translate(" + project(oldParentLocation.x, oldParentLocation.depth) + ")";
      }
      else if( d.parent ){
        return "translate(" + project(d.parent.x, d.parent.depth) + ")";
      }
      else{
        return "translate(" + project(0, 0) + ")"; //Fall back to the new location of the parent.
      }
    })//Create at the parent, then transition to their proper position.
    .on('click', toggleCollapsed);

  enterNodes.append("circle")
    .attr("r", d => d.children || d._children ? 4 : 3);

  enterNodes.append("text")
    .attr("dy", ".31em")
    .text(function(d) {
      if(d.data && d.data.dependency && d.data.dependency.project_name){
        return d.data.dependency.project_name;
      }
    });

  let allNodes = g.selectAll(".node"); //Optimization: could do .merge(nodes) after the append('g') above if this selectAll is a bottleneck (https://github.com/d3/d3-selection#selection_merge)
  allNodes
    .transition().duration(transitionTime)
    .attr("transform", function(d) { return "translate(" + project(d.x, d.depth) + ")"; });

  let allNodesText = g.selectAll('.node text');
  allNodesText
    .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; }) //Can't smoothly transition "start" to "end".
    .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
    .attr("x", function(d) { return d.x < 180 ? 6 : -6; });
}