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

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
}

function ready(){
  //Look for livereload if running locally:
  if( window.location.hostname == "localhost" ){
    var script   = document.createElement("script");
    script.type  = "text/javascript";
    script.src   = 'http://' + (location.host || 'localhost').split(':')[0] +':35729/livereload.js?snipver=1';    // use this for linked script
    document.head.appendChild(script);
  }

  var svg = d3.select("svg");

  svg.attr('height', document.body.clientHeight - 3); //Not sure why, but I get a vertical scrollbar if this -3 is not there.
  svg.attr('width', document.body.clientWidth);

  center = [
    (document.body.clientWidth)/2, //-250 to Make room for sidebar, when we eventually add one.
    (document.body.clientHeight-60)/2+60 //Make room for top bar
  ];
  radius = Math.min(document.body.clientWidth, document.body.clientHeight-80)/2;

  //Load data:
  qwest.get('eslint-tree.json')
  .then(function(xhr, response) {

    data = response;

    //dependencyTree.initialize(svg, _.cloneDeep(data), center, radius);
    circlePack.initialize(svg, _.cloneDeep(data), center, radius);
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

  $('#search').on('submit', function(event){
    event.preventDefault();
    $('.search-button').attr('value', 'Searching...');

    let searchTerm = $('#search-input').val();

    qwest.get('https://libraries.io/api/search?q='+encodeURIComponent(searchTerm))
    .then(function(xhr, response){
      $('.search-button').attr('value', 'Search');
      $('.search-results').html('').show();
      response.forEach( function(searchResult){
        let searchResultElt = $('.search-result-master').clone().removeClass('search-result-master').addClass('search-result');
        searchResultElt.data('platform', searchResult.platform);
        searchResultElt.data('name', searchResult.name);
        let date = Date.parse(searchResult.latest_release_published_at);
        searchResultElt.find('.search-result-title').text(searchResult.name);
        searchResultElt.find('.search-result-version').text(searchResult.latest_release_number);
        searchResultElt.find('.search-result-description').text(searchResult.description);
        searchResultElt.find('.search-result-details').text(searchResult.platform+" - "+searchResult.language+" - Updated "+formatDate(date)+" - "+searchResult.stars+" stars");

        $('.search-results').append(searchResultElt);
      });
    }, function(e) {
      console.error(e);
      $('.search-button').attr('value', 'Search');
      //TODO: Handle search failure.
    });
  });

  $('.search-results').on('click', '.search-result', function(event){
    $('.search-button').attr('value', 'Loading...');
    $('.search-results').hide();
    let selectedPlatform = $(this).data('platform');
    let selectedName = $(this).data('name');

    //Get the dependency tree data from libraries.io (via proxy).
    qwest.get('/tree', {platform: selectedPlatform, name: selectedName})
    .then( function(xhr, response){
      data = response;
      svg.selectAll("*").remove();
      circlePack.initialize(svg, _.cloneDeep(data), center, radius);

    }, function(e){
      console.error(e);
      //TODO: Handle tree get failure.
    })
    .then(function(){
      $('.search-button').attr('value', 'Search');
    });
  });

  $('svg').on('click', function(){
    $('.search-results').hide();
  });

}




document.addEventListener('DOMContentLoaded', ready);
 
