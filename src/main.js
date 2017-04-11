import * as d3 from "d3";
import qwest from "qwest";
import _ from 'lodash';
import * as dependencyTree from "./dependencyTree";
import * as circlePack from "./circlePack";
import * as sunburst from "./sunburst";

// Import styles
import './style.scss';


function ready(){
  var svg = d3.select("svg");

  svg.attr('height', document.body.clientHeight - 3); //Not sure why, but I get a vertical scrollbar if this -3 is not there.
  svg.attr('width', document.body.clientWidth);

  //Load data:
  qwest.get('eslint-tree.json')
  .then(function(xhr, response) {

    //Parse data into a hierarchy.
    let data = d3.hierarchy(response, project => {
      if(project.dependencies.length > 0){
        return project.dependencies.filter( x => x); //Filter out nulls (Not sure why they are in there in the first place).
      }
    })
    .sum(function(d) { return 1; });

    //dependencyTree.initialize(svg, data);
    //circlePack.initialize(svg, data);
    sunburst.initialize(svg, _.cloneDeep(data));


    //Create thumbnail selectors:
    /*dependencyTree.initialize(d3.select('.tree-selector svg'), _.cloneDeep(data));
    circlePack.initialize(d3.select('.pack-selector svg'), _.cloneDeep(data));
    sunburst.initialize(d3.select('.sun-selector svg'), _.cloneDeep(data));*/


  })
  .catch(function(err){
    console.error(err);
  });

}




document.addEventListener('DOMContentLoaded', ready);
 
