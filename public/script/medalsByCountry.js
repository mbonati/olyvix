/*
var ds = new Miso.Dataset({
  data: [ 
    { one : 1, two : 4, three : 7 },
    { one : 2, two : 5, three : 8 },
    { one : 6, two : 8, three : 55 },
    { one : 6, two : 8, three : 60 },
    { one : 6, two : 9, three : 66 }
  ]
});

ds.fetch({ 
  success: function() {
    this.groupBy('one', ['two']).each(function(row){
    	console.log(JSON.stringify(row));
    });
  }
});
*/


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

var editions = new Array();
var edition = 1;
var lastEdition = 27;

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

updateGameEdition(edition);
loadData();

svg = d3.select("body").append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      .attr("id", 'svg');

document.getElementById('prevBtn').onclick = function() {
  edition--;
  //show_year(year);
  updateGameEdition(edition);
}

document.getElementById('nextBtn').onclick = function() {
  edition++ ;
  //show_year(year);
  updateGameEdition(edition);
}

function updateGameEdition(y){
  document.getElementById('prevBtn_a').style.display = (y>1) ? 'inline' : 'none';
  document.getElementById('nextBtn_a').style.display = (y<lastEdition) ? 'inline' : 'none';
  document.getElementById('prevBtn_a').innerHTML = (y-1).toString();
  document.getElementById('nextBtn_a').innerHTML = (y+1).toString();
  document.getElementById('big_year').innerHTML = y.toString();
}

function show_year(year) {
  loading(false);
  removeAllLinks();
  var sql = HOST + THE_ANDREW_SQL.format(year);

  d3.json(sql , function(data) {
      loading(true);
      for(var i = 0; i < data.rows.length; ++i) {
        country = data.rows[i]
        countryData[i] = {
          idx: i,
          iso: country.iso,
          value: Math.pow(parseFloat(country.imports)/126993.0, 0.17),
          links: [2, 33],
          name: "country " + i,

        }
        countryDataByIso[country.iso] = countryData[i];
      }

      start(year);
    
  });
}; 

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
    
    
	/*    
    dataSource.each(function(row){
    	console.log(JSON.stringify(row));
    });
    */

    //console.log("OK! There are " + dataSource.groupBy('GamesId',['HostCity']).length + " editions");
    //console.log("There are " + dataSource.length + " rows");
}

function isDataLoading(){
	return dataLoading;
}
// End Data Manipulation

