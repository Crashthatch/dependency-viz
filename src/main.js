import * as d3 from "d3";
import qwest from "qwest";
import _ from 'lodash';
import $ from 'jquery';
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
  .then(function(xhr, data) {

    //dependencyTree.initialize(svg, _.cloneDeep(data));
    circlePack.initialize(svg, _.cloneDeep(data));
    //sunburst.initialize(svg, _.cloneDeep(data));


    //Create thumbnail selectors:
    /*dependencyTree.initialize(d3.select('.tree-selector svg'), _.cloneDeep(data));
    circlePack.initialize(d3.select('.pack-selector svg'), _.cloneDeep(data));
    sunburst.initialize(d3.select('.sun-selector svg'), _.cloneDeep(data));*/

    $('.tree-selector').on('click', function(){
      svg.selectAll("*").remove();
      dependencyTree.initialize(svg, _.cloneDeep(data));
    });
    $('.pack-selector').on('click', function(){
      svg.selectAll("*").remove();
      circlePack.initialize(svg, _.cloneDeep(data));
    });
    $('.sun-selector').on('click', function(){
      svg.selectAll("*").remove();
      sunburst.initialize(svg, _.cloneDeep(data));
    });


  })
  .catch(function(err){
    console.error(err);
  });

}




document.addEventListener('DOMContentLoaded', ready);
 
