import * as d3 from "d3";
import { transitionTime } from "./config";

var data, g;

export function initialize(svg, hierarchy){
  data = hierarchy;
  var width = +svg.attr("width");
  var height = +svg.attr("height");
  g = svg.append("g").attr('id', 'tree').attr("transform", "translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")");

  updateTree();
}


function project(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
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
  else { //Expand 1 layer.
    d.children = d._children;
    d._children = null;
    d.children.forEach( (child) => {
      setCollapsed(child);
    });
  }

  updateTree();
}

export function updateTree(){

  //Create radial tree layout
  let tree = d3.tree()
    .size([360, 900])
    .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

  //Put data into tree.
  var root = tree(data);

  //Create new links and nodes
  var links = g.selectAll(".link")
    .data(root.descendants().slice(1), d => d.data.dependency.id);

  var exitLinks = links.exit().remove();

  var enterLinks = links.enter()
    .append("path")
    .attr("class", "link");

  var allLinks = g.selectAll('.link');
  allLinks
    .transition().duration(transitionTime)
    .attr("d", function(d) {
      if(d.parent == root ){
        //Straight lines in the middle.
        return "M" + project(d.x, d.y)
          + "L" + project(d.parent.x, d.parent.y);

      }
      return "M" + project(d.x, d.y)
        + "C" + project(d.x, (d.y + d.parent.y) / 2)
        + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
        + " " + project(d.parent.x, d.parent.y);
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
      if(d.parent){
        return "translate(" + project(d.parent.x, d.parent.y) + ")";
      }
      else{
        return "translate(" + project(0, 0) + ")";
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
    .attr("transform", function(d) { return "translate(" + project(d.x, d.y) + ")"; });

  let allNodesText = g.selectAll('.node text');
  allNodesText
    .style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; }) //Can't smoothly transition "start" to "end".
    .attr("transform", function(d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
    .attr("x", function(d) { return d.x < 180 ? 6 : -6; });
}