import * as d3 from "d3";
import qwest from "qwest";
import _ from 'lodash';
import $ from 'jquery';
import * as dependencyTree from "./dependencyTree";
import * as circlePack from "./circlePack";
import * as sunburst from "./sunburst";

// Import styles
import './style.scss';

let data, radius, center;

function ready(){
  var svg = d3.select("svg");

  svg.attr('height', document.body.clientHeight - 3); //Not sure why, but I get a vertical scrollbar if this -3 is not there.
  svg.attr('width', document.body.clientWidth);

  center = [
    (document.body.clientWidth-200)/2, //Make room for sidebar
    (document.body.clientHeight-80)/2+80 //Make room for top bar
  ];
  radius = Math.min(document.body.clientWidth-200, document.body.clientHeight-80)/2;

  //Load data:
  qwest.get('d3-tree.json')
  .then(function(xhr, response) {

    data = response;

    dependencyTree.initialize(svg, _.cloneDeep(data), center, radius);
    //circlePack.initialize(svg, _.cloneDeep(data), center, radius);
    //sunburst.initialize(svg, _.cloneDeep(data), center, radius);


    //Create thumbnail selectors:
    /*dependencyTree.initialize(d3.select('.tree-selector svg'), _.cloneDeep(data));
    circlePack.initialize(d3.select('.pack-selector svg'), _.cloneDeep(data));
    sunburst.initialize(d3.select('.sun-selector svg'), _.cloneDeep(data));*/

  })
  .catch(function(err){
    console.error(err);
  });

  $('.tree-selector').on('click', function(){
    svg.selectAll("*").remove();
    dependencyTree.initialize(svg, _.cloneDeep(data), center, radius);
  });
  $('.pack-selector').on('click', function(){
    svg.selectAll("*").remove();
    circlePack.initialize(svg, _.cloneDeep(data), center, radius);
  });
  $('.sun-selector').on('click', function(){
    svg.selectAll("*").remove();
    sunburst.initialize(svg, _.cloneDeep(data), center, radius);
  });

  $('.search-button').on('click', function(){
    $('.search-button').text('Loading...');

    let searchTerm = $('#search-input').val();

    qwest.get('https://libraries.io/api/search?q='+encodeURIComponent(searchTerm))
    .then(function(xhr, response){
      if(response.length > 0){
        return qwest.get('/tree', {platform: response[0].platform, name: response[0].name});
      }
    }, function() {
      //TODO: Handle search failure.
    })
    .then( function(xhr, response){
      data = response;
      svg.selectAll("*").remove();
      dependencyTree.initialize(svg, _.cloneDeep(data), center, radius);

    }, function(){
      //TODO: Handle tree get failure.
    })
    .then(function(){
      $('.search-button').text('Search');
    });
  });

}




document.addEventListener('DOMContentLoaded', ready);
 
