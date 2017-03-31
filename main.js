import * as d3 from "d3";

function ready(){
  console.log('loaded');

  d3.select('hi');
}

document.addEventListener('DOMContentLoaded', ready, false);