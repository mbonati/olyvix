
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
var vizCreated = false;

// -- settings
var settings = {
  MAIN_BALL_RADIO: 210,
  MAX_LINE_SIZE: 200,
};

//Countries related data structures
var allCountries = new Array();
var countriesData = {};

//Editions related data structures
var editions = new Array();
var currentGameEdition = null;
var currentGameIndex = -1;

// Current edition data structures
var editionsData = null; //miso dataset
var computedCountriesData = {}; //new Array();

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

var countriesDataSource = new Miso.Dataset({
    url : "../data/vwCountries.csv",
    delimiter : ",",
    columns : [
        { name : "code", type: "string" },
        { name : "continent_code", type: "string" },
        { name : "name", type: "string" },
        { name : "iso3", type: "string" },
        { name : "number", type: "number" },
        { name : "full_name", type: "string" },
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
  
  //get the rows for the current edition
  editionsData = dataSource.where({
    rows: function(row){
        return (row.GamesId == edition.gamesId);
    }
  });

    computedCountriesData = {};//new Array();
    
    var i = 0;
   editionsData.each(function(row,rowIndex){
    //console.log("row: " + row);
    countryItem = row;
    countryItem.idx = ++i;
    countryItem.position = function(f) {
              if (f === undefined) f = 1
               return {
                    x: f*settings.MAIN_BALL_RADIO*Math.cos(angleFromIdx(this.idx)),
                    y: f*settings.MAIN_BALL_RADIO*Math.sin(angleFromIdx(this.idx))
               }
          };
     //countryItem.value = row.Total;// Math.pow(parseFloat(row.Total)/126993.0, 0.17);
     countryItem.value = Math.pow(parseFloat(row.Total)/12699.0, 0.17);
     countryItem.angle = function() {
                return angleFromIdx(this.idx);
          };
    computedCountriesData[countryItem.CountryCode] = countryItem;
    
    //console.log("countryItem: " + countryItem)
  });
      
    window.onresize = function(event) {
      svg.attr("width", window.innerWidth);
      svg.attr("height", window.innerHeight);
      lines.attr("transform", "translate(" + window.innerWidth/2 + "," +  window.innerHeight/2 +" )");
      document.getElementById('innerCircle').style.left = window.innerWidth/2;
      document.getElementById('innerCircle').style.top = window.innerHeight/2;
    }
    
    updateViz();

    loading(true);

}; 

//display the sunburst
function createViz(){
    
    removeAllLinks();
    
    svg.selectAll("g").remove();
    lines = svg.append('svg:g')
      .attr("transform", "translate(" + w2 + "," +  h2 +" )")

    svg.style['position'] = 'absolute';
    svg.style['z-index'] = 1000;
    
    document.getElementById('svg').style['position'] = 'absolute';
    document.getElementById('svg').style['z-index'] = 1000;

    var strokeWidth = 700 / allCountries.length;
    
    lines.selectAll("line.country")
    .data(allCountries, function(d) {
      return d.countryCode;
    })
    .enter()
    .append("svg:line")
      .attr("class", "country")
      .attr('id', function(d) {
          return d.idx;
      })
      .attr('x1', function(d) {
          return settings.MAIN_BALL_RADIO*Math.cos(angleFromIdx(d.idx));
      })
      .attr('y1', function(d) {
          return settings.MAIN_BALL_RADIO*Math.sin(angleFromIdx(d.idx));
      })
      .attr('x2', function(d) {
          //the first creation value is 0 (then invisible)
          v = 0;
          return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.cos(angleFromIdx(d.idx));
      })
      .attr('y2', function(d) {
          //the first creation value is 0 (then invisible)
          v = 0;
          //console.log("y2 value="+v);
          return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.sin(angleFromIdx(d.idx));
      })
      .attr('stroke', function(d) {
          return "#FF0000"; //default color
      })
      .attr('stroke-width', strokeWidth)
      .on("mouseover", function(d, e) {
        tooltip.style.display = 'block';
        tooltip.style.position = 'absolute';
        tooltip.style['z-index'] = '20000';
        tooltip.innerHTML = d.countryName;
        tooltip.style.left = d3.event.clientX+10+'px';
        tooltip.style.top = d3.event.clientY+10+'px';
        fade(.2, 50, d);
        this.style['cursor'] = 'pointer';
      })
      .on("mouseout", function(d) {
        tooltip.style.display = 'none';
        fade(1, 500, d);
      });
    
      var restoreCountries = function() {
        returning_back = true;
        lines.selectAll("line.country")
          .data(allCountries)
          .transition()
            .attr('x2', function(d) {
                 var c = computedCountriesData[d.countryCode];
                  var v = 0;
                  if (c) {
                    v = c.value;
                  }
                //console.log("x2 value="+v);
                return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.cos(angleFromIdx(d.idx));
            })
            .attr("stroke",function(d){
                var item = computedCountriesData[d.countryCode];
                if (item){
                    return colorForItem(item);
                } else {
                    //no item found for this Edition/Country
                    //console.log("No item found for " + d.countryCode);
                    return"#00FF00";
                }
                //return colorByCountry(d.countryCode); 
            })
            .attr('y2', function(d) {
                  var c = computedCountriesData[d.countryCode];
                  var v = 0;
                  if (c) {
                    v = c.value;
                  }
                //console.log("y2 value="+v);
                return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.sin(angleFromIdx(d.idx));
            })
            .each("end", function() {
              returning_back = false;
            })
      }
      restoreCountries();
      
      vizCreated = true;
}

function updateViz(){
    
    if (!vizCreated){
        createViz();
        return;
    } else {
        lines.selectAll("line.country")
          .data(allCountries)
          .transition()
            .attr('x2', function(d) {
                 var c = computedCountriesData[d.countryCode];
                  var v = 0;
                  if (c) {
                    v = c.value;
                  }
                //console.log("x2 value="+v);
                return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.cos(angleFromIdx(d.idx));
            })
            .attr("stroke",function(d){
                var item = computedCountriesData[d.countryCode];
                if (item){
                    return colorForItem(item);
                } else {
                    //no item found for this Edition/Country
                    //console.log("No item found for " + d.countryCode);
                    return"#00FF00";
                }
                //return colorByCountry(d.countryCode); 
            })
            .attr('y2', function(d) {
                  var c = computedCountriesData[d.countryCode];
                  var v = 0;
                  if (c) {
                    v = c.value;
                  }
                //console.log("y2 value="+v);
                return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.sin(angleFromIdx(d.idx));
            })
            .each("end", function() {
              //returning_back = false;
            });
    }        
    

}    

function fade(opacity, ttt, t) {
   A = lines.selectAll("line.country")
       .filter(function(d) {
         return d.countryCode != t.countryCode;
       })
       .transition()
   if(returning_back) {
     A = A.delay(1000)
   }
   A.transition()
     .duration(ttt)
     .style("opacity", opacity);
}

function angleFromIdx(i) {
  return -Math.PI/2 + (i-1)*2*Math.PI/allCountries.length;
}

function colorForItem(item){
    return colorByCountry(item.CountryCode);    
}

function colorByCountry(countryCode) {
    
    
    //return d3.interpolateRgb(d3.rgb(0,0,255),d3.rgb(0,255,0) )(.39);
    //return d3.interpolateRgb(d3.rgb("#FF5D45"),d3.rgb("#FFFF96") )(.39);
    
    var countryInfo = countriesData[countryCode];
    if (countryInfo){
        var continentCode = countryInfo.continent_code;
        if (continentCode=='EU')
            return '#009D57';
        else if (continentCode=='OC')
            return '#0081BC';
        else if (continentCode=='OC')
            return '#0081BC';
        else if (continentCode=='AS')
            return '#7EA8ED';
        else
            return '#FFFF66';
    } else {
        return '#FFFF66';
    }        
    
}

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

function loadCountriesData(){
    dataLoading = true;
    loading(false);
    countriesDataSource.fetch({
        success : function(){
            countriesDataReady();
        }
    });
}

function countriesDataReady(){
    loading(true); 
	dataLoading = false;
    
    countriesData = {};
    countriesDataSource.each(function(row){
        countriesData[row.iso3] = row;
    });
    console.log("Italy : " + countriesData['ITA']);
    
    loadData();
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
    
    //build the All Countries data store
    var rowIndex = 0;
    allCountries = new Array();
    dataSource.groupBy("CountryCode",["CountryName"],{
        method:function(arr){
            return arr[0];
        }
    }).each(function(row){
        var countryItem = { countryCode : row.CountryCode, countryName: row.CountryName };
        countryItem.idx = rowIndex++;
        countryItem.angle = function() {
                return angleFromIdx(this.idx);
          };
        countryItem.position = function(f) {
              if (f === undefined) f = 1
               return {
                    x: f*settings.MAIN_BALL_RADIO*Math.cos(angleFromIdx(this.idx)),
                    y: f*settings.MAIN_BALL_RADIO*Math.sin(angleFromIdx(this.idx))
               }
          };
        allCountries.push(countryItem);
    });
    console.log("Total countries: " + allCountries.length);
    
    setGamesEditionIndex(editions.length-1);
}

function isDataLoading(){
	return dataLoading;
}
// End Data Manipulation


// viz lifecycle
function startViz(){
    tooltip = document.getElementById('tooltip');
    
    loadCountriesData();
}

// entry point
//startViz();