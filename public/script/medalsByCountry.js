
var loading_timer = null;
var dataLoading = false;
var returning_back = false;
var w = innerWidth,
    h = innerHeight,
    w2 = w/2,
    h2 = h/2,
    z = d3.scale.category20c(),
    i = 0;

var svg, lines;
var tooltip;
var year = 1896;
var minYear = 1896;
var maxYear = 2012;

// -- settings
var settings = {
  MAIN_BALL_RADIO: 210,
  MAX_LINE_SIZE: 100,
};


//Editions related data structures
var editions = new Array();
var currentGameEdition = null;
var currentGameIndex = -1;

// Current edition data structures
var editionsData = null; //miso dataset
var computedCountriesData = new Array();

var dataSource = new Miso.Dataset({
  url : "../data/vwMedalsByCountry.csv",
  delimiter : ",",
  columns : [
    { name : "GamesId" , type : "number" },
    { name : "Year", type : "number" },
    { name : "HostCity", type : "string" },
    { name : "CountryCode", type : "string" },
    { name : "CountryName", type : "string" },
    { name : "Rank", type : "number" },
    { name : "Gold", type : "number" },
    { name : "Silver", type : "number" },
    { name : "Bronze", type : "number" },
    { name : "Total", type : "number" },
  ]
});

svg = d3.select("body").append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      .attr("id", 'svg');

document.getElementById('prevBtn').onclick = function() {
    setGamesEditionIndex(currentGameIndex-1);
}

document.getElementById('nextBtn').onclick = function() {
    setGamesEditionIndex(currentGameIndex+1);
}

// Select the current game by ordinal index (zero-based)
function setGamesEditionIndex(gameIndex){

    //check editions bounds
    if (gameIndex<0){ 
        gameIndex = 0;
    }
    if (gameIndex>=(editions.length)){
        gameIndex = editions.length - 1;
    }
  
  currentGameIndex = gameIndex;
  currentGameEdition = editions[gameIndex];
  
  var nextGame = (currentGameIndex<(editions.length-1)?editions[gameIndex+1]:null);
  var prevGame = (currentGameIndex>0?editions[gameIndex-1]:null);
  
  updateGameEdition(currentGameEdition,prevGame,nextGame);
  
  updateGameEditionData(currentGameEdition);
}

// update game edition display
function updateGameEdition(edition, prevEdition, nextEdition){
  d3.selectAll('#prevBtn_a').style("display",  (prevEdition!=null) ? 'inline' : 'none');
  d3.selectAll('#nextBtn_a').style("display",  (nextEdition!=null) ? 'inline' : 'none');

  d3.selectAll('#prevBtn_a').text((prevEdition!=null) ? prevEdition.year : '');
  d3.selectAll('#nextBtn_a').text((nextEdition!=null) ? nextEdition.year : '');
  
  d3.selectAll('#big_year').text(edition.year);
  d3.selectAll('#hostCity').text(edition.hostCity);
}

// build the sunburst visualization
function updateGameEditionData(edition) {
  loading(false);
  
  removeAllLinks();
  
  //get the rows for the current edition
  editionsData = dataSource.where({
    rows: function(row){
        return (row.GamesId == edition.gamesId);
    }
  });
  
    svg.selectAll("g").remove();
    lines = svg.append('svg:g')
      .attr("transform", "translate(" + w2 + "," +  h2 +" )")

    svg.style['position'] = 'absolute';
    svg.style['z-index'] = 1000;

    computedCountriesData = new Array();
    
   editionsData.each(function(row,rowIndex){
    //console.log("row: " + row);
    countryItem = row;
    countryItem.position = function(f) {
              if (f === undefined) f = 1
               return {
                    x: f*settings.MAIN_BALL_RADIO*Math.cos(angleFromIdx(this.idx)),
                    y: f*settings.MAIN_BALL_RADIO*Math.sin(angleFromIdx(this.idx))
               }
          };
     countryItem.angle = function() {
                return angleFromIdx(this.idx);
          };
    computedCountriesData.push(countryItem);
    
    console.log("countryItem: " + countryItem)
  });
      
    window.onresize = function(event) {
      svg.attr("width", window.innerWidth);
      svg.attr("height", window.innerHeight);
      lines.attr("transform", "translate(" + window.innerWidth/2 + "," +  window.innerHeight/2 +" )");
      document.getElementById('innerCircle').style.left = window.innerWidth/2;
      document.getElementById('innerCircle').style.top = window.innerHeight/2;
    }

  loading(true);

}; 

function removeAllLinks() {
    if (lines){
        lines.selectAll('path.link').remove();
    }
}

// display loading progress animation
function loading(o) {
  if(o) {
    clearInterval(loading_timer);
    loading_timer = null;
  }
  else {
    if (loading_timer != null) return;
    loading_timer = setInterval(function() {
      svg.append("svg:circle")
          .attr('r', 2)
          .attr('cx', w2)
          .attr('cy', h2)
          .style("fill", '#FFF')//z(++i))
          .style("fill-opacity", 0.3)
          //.attr('filter', "url(#blend)")
        .transition()
          .duration(2000)
          .ease(Math.sqrt)
          .attr('r', 100)
          .style("fill-opacity", 1e-6)
         .remove();
    }, 700);
  }
}


// Data Manipulation

//fetch data from csv file
function loadData(){
	dataLoading = true;
	loading(false); 
	dataSource.fetch({ 
	  success : function() {
	  	dataReady();
	  }
	});
}

//called when load data has been completed
function dataReady(){
	loading(true); 
	dataLoading = false;
    
    //build editions data array
    //group the data for retrieve the editions
    editions = new Array();
    dataSource.groupBy("Year",["HostCity","GamesId"],{
            method:function(arr){
                return arr[0];
            }
        }).each(function(row){
                var editionItem = { gamesId : row.GamesId, hostCity: row.HostCity, year : row.Year };
                editions.push(editionItem);
            });
    console.log("Total editions: " + editions.length);
    editions.reverse();
    setGamesEditionIndex(editions.length-1);
}

function isDataLoading(){
	return dataLoading;
}
// End Data Manipulation


// viz lifecycle
function startViz(){
    loadData();
}

// entry point
startViz();