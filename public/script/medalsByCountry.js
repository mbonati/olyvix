
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
  MAX_LINE_SIZE: 200,
};

//Countries related data structures
var allCountries = new Array();

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
  
    svg.selectAll("g").remove();
    lines = svg.append('svg:g')
      .attr("transform", "translate(" + w2 + "," +  h2 +" )")

    svg.style['position'] = 'absolute';
    svg.style['z-index'] = 1000;
    
    document.getElementById('svg').style['position'] = 'absolute';
    document.getElementById('svg').style['z-index'] = 1000;


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
function updateViz(){
      removeAllLinks();
    
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
          var c = computedCountriesData[d.countryCode];
          var v = 0;
          if (c) {
            v = c.value;
          }
          //console.log("x2 value="+v);
          return (settings.MAIN_BALL_RADIO + v*settings.MAX_LINE_SIZE)*Math.cos(angleFromIdx(d.idx));
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
      .attr('stroke', function(d) {
        return colorByCountry(d.CountryCode); 
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
      /*
      .on('click', function(sourceCountry) {
          console.log("click");
          loading(false);
          restoreCountries();
          d3.json(HOST + COUNTRY_LINKS_URL.format(sourceCountry.iso, year), function(links) { 
            document.getElementById('big_year').innerHTML = sourceCountry.name
            links = links.rows;
            loading(true);
            var max_sum = d3.max(links, function(a) { return a.sum});
            var linksByIso = {};
            for(var i = 0; i < links.length; ++i) {
              linksByIso[links[i].from_iso] = links[i].sum;
            }
    
            lines.selectAll('line.country')
              .filter(function(d, i) {
                if(d.iso == sourceCountry.iso) return false;
                for(var l = 0; l < links.length; ++l) {
                  if(d.iso == links[l].from_iso) {
                    return true;
                  }
                }
                return false;
              })
              .transition()
                .attr('x2', function(d) {
                    var f = 1.0 - 0.2*(Math.sqrt(linksByIso[d.iso]/max_sum));
                    return f*(settings.MAIN_BALL_RADIO)*Math.cos(angleFromIdx(d.idx));
                })
                .attr('y2', function(d) {
                    var f = 1.0 - 0.2*(Math.sqrt(linksByIso[d.iso]/max_sum));
                    return f*(settings.MAIN_BALL_RADIO)*Math.sin(angleFromIdx(d.idx));
                })
    
            lines.selectAll('path.link').remove()
            lines.selectAll('path.link')
              .data(links.filter(function(d) {
                return allCountriesByISO[d.from_iso] !== undefined;
              }))
              .enter()
                .append('path')
                .attr('class', 'link')
                .attr("d", function(d) {
                  var op = sourceCountry.position()
                  var f = 1.0 - 0.2*Math.sqrt(d.sum/max_sum);
                  var tp = allCountriesByISO[d.from_iso].position(f*0.98);
                  var s = "M " + op.x + "," + op.y;
                  var e = "C 0,0 0,0 " + tp.x +"," + tp.y;
                  return s + " " + e; //'M 0,420 C 110,220 220,145 0,0'
                })
                .attr('fill', 'none')
                .attr('stroke', function(d) {
                  var t = allCountriesByISO[d.from_iso];
                  return colorByRegion(t.region); 
                })
                .attr('stroke-width', function(d) {
                  return 0.2 + 1.4*d.sum/max_sum;
                })
                .attr('opacity', function(d) {
                  return 0.3 + 0.5*d.sum/max_sum;
                });
          });
    
    
      });*/
    
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


function colorByCountry(r) {
    return '#FFFF66';
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

    loadData();
}

// entry point
startViz();