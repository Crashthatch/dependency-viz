import * as d3 from "d3";
import qwest from "qwest";
import * as dependencyTree from "./dependencyTree";
import * as circlePack from "./circlePack";

// Import styles
import './style.scss';


function ready(){
  var svg = d3.select("svg");

  //Load data:
  qwest.get('eslint-tree.json')
  .then(function(xhr, response) {
    console.log(response);

    //Parse data into a hierarchy.
    let data = d3.hierarchy(response, project => {
      if(project.dependencies.length > 0){
        return project.dependencies.filter( x => x); //Filter out nulls (Not sure why they are in there in the first place).
      }
    })
    .sum(function(d) { return 1; })
    .sort(function(a, b) { return b.value - a.value; });

    //dependencyTree.initialize(svg, data);
    circlePack.initialize(svg, data);


  })
  .catch(function(err){
    console.error(err);
  });

}




document.addEventListener('DOMContentLoaded', ready);
 
