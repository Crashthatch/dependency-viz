import * as d3 from "d3";
import qwest from "qwest";

// Import styles
import './style.scss';

var svg, g, tree, data;

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

function updateTree(){

  var transitionTime = 600;

  //Create radial tree layout
  tree = d3.tree()
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


function ready(){
  //Create SVG:
  svg = d3.select("svg");
  var width = +svg.attr("width");
  var height = +svg.attr("height");
  g = svg.append("g").attr("transform", "translate(" + (width / 2 + 40) + "," + (height / 2 + 90) + ")");

  //Load data:
  qwest.get('eslint-tree.json')
  .then(function(xhr, response) {
    console.log(response);

    //Parse data into a hierarchy.
    data = d3.hierarchy(response, project => {
      if(project.dependencies.length > 0){
        return project.dependencies.filter( x => x); //Filter out nulls (Not sure why they are in there in the first place).
      }
    });

    updateTree();


  })
  .catch(function(err){
    console.error(err);
  });

}




document.addEventListener('DOMContentLoaded', ready);
 
