import { Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as L from 'leaflet';
import * as crossfilter from 'crossfilter';

import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardMapService } from './services/dashboard-map.service';
import { IMediaData } from './interfaces/media-data';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [DashboardDataService, DashboardMapService]
})
export class DashboardComponent implements OnInit {

  data: any[];
  errorMessage: string;
  header = 'VGI4HWM Dashboard Components';
  subheader = 'Foto- und Videoaufnahmen';


  private _timeChart: dc.BarChart;

  constructor(private _dataService: DashboardDataService, private _mapService: DashboardMapService) {}

  ngOnInit(): void {

    this._mapService.createMap();

    this._dataService.getData()
      .subscribe( response => this.receiveData(response),
                error => this.errorMessage = error
    );

  }

  private receiveData( mediaData: IMediaData[] ): void {

    const fullDateFormat = d3.time.format.iso;

    for ( const mediaElement of mediaData ){
      (<IMediaData>mediaElement).date = d3.time.format.iso.parse(mediaElement.timestamp);
    }

    const cf = crossfilter(mediaData as IMediaData[]);

    const allDim = cf.dimension( (d: IMediaData) => d );
    const dateDim = cf.dimension( (d: IMediaData) => d.date );

    this._timeChart = dc.barChart('#time-chart');

    this._timeChart.on('renderlet', () => this._mapService.updateMarker(allDim.top(Infinity)))
        .height(300)
        .margins({top: 20, right: 0, bottom: 20, left: 25})
        .dimension(dateDim)
        .group(dateDim.group())
        .barPadding(2)
        .centerBar(true)
        .elasticY(true)
        .x(d3.time.scale().domain([
          d3.time.day.offset(d3.min(mediaData, (d: IMediaData) => d.date ), -1),
          d3.time.day.offset(d3.max(mediaData, (d: IMediaData) => d.date ), 1)
          ]))
        .xUnits(function(){ return 20; });

    dc.renderAll();

  }

  public onResize(event): void {
    this._timeChart.render();
  }

  private receiveSampleData( beerData: any ): void {


    let breweryMarkers = new L.FeatureGroup([]);
    let fullDateFormat = d3.time.format('%a, %d %b %Y %X %Z');
    let yearFormat = d3.time.format('%Y');
    let monthFormat = d3.time.format('%b');
    let dayOfWeekFormat = d3.time.format('%a');

    // _.each(beerData, function(d) {
    //   d.count = +d.count;
    //   // round to nearest 0.25
    //   d.rating_score = Math.round(+d.rating_score * 4) / 4;
    //   d.beer.rating_score = Math.round(+d.beer.rating_score * 4) / 4;
    //   // round to nearest 0.5
    //   d.beer.beer_abv = Math.round(+d.beer.beer_abv * 2) / 2;
    //   // round to nearest 10
    //   d.beer.beer_ibu = Math.floor(+d.beer.beer_ibu / 10) * 10;
    //   d.first_had_dt = fullDateFormat.parse(d.first_had);
    //   d.first_had_year = +yearFormat(d.first_had_dt);
    //   d.first_had_month = monthFormat(d.first_had_dt);
    //   d.first_had_day = dayOfWeekFormat(d.first_had_dt);
    // });

    let ndx = crossfilter(beerData);

    let yearDim  = ndx.dimension(function(d: any) {return d.first_had_year; }),
      monthDim  = ndx.dimension(dc.pluck('first_had_month')),
      dayOfWeekDim = ndx.dimension(dc.pluck('first_had_day')),
      ratingDim = ndx.dimension(dc.pluck('rating_score')),
      commRatingDim = ndx.dimension(function(d: any) {return d.beer.rating_score; }),
      abvDim = ndx.dimension(function(d: any) {return d.beer.beer_abv; }),
      ibuDim = ndx.dimension(function(d: any) {return d.beer.beer_ibu; }),
      allDim = ndx.dimension(function(d) {return d; });

    let all = ndx.groupAll();  

    let countPerYear = yearDim.group().reduceCount(),
      countPerMonth = monthDim.group().reduceCount(),
      countPerDay = dayOfWeekDim.group().reduceCount(),
      countPerRating = ratingDim.group().reduceCount(),
      countPerCommRating = commRatingDim.group().reduceCount(),
      countPerABV = abvDim.group().reduceCount(),
      countPerIBU = ibuDim.group().reduceCount();
    
    let yearChart   = dc.pieChart('#chart-ring-year'),
      monthChart   = dc.pieChart('#chart-ring-month'),
      dayChart   = dc.pieChart('#chart-ring-day'),
      ratingCountChart  = dc.barChart('#chart-rating-count'),
      commRatingCountChart  = dc.barChart('#chart-community-rating-count'),
      abvCountChart  = dc.barChart('#chart-abv-count'),
      ibuCountChart  = dc.barChart('#chart-ibu-count'),
      volumeChart = dc.barChart('#monthly-volume-chart'),
      dataCount = dc.dataCount('#data-count'),
      dataTable = dc.dataTable('#data-table');




      yearChart
      .width(150)
      .height(150)
      .dimension(yearDim)
      .group(countPerYear)
      .innerRadius(20);

      monthChart
      .width(150)
      .height(150)
      .dimension(monthDim)
      .group(countPerMonth)
      .innerRadius(20)
      .ordering(function (d) {
        var order = {
          'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4,
          'May': 5, 'Jun': 6, 'Jul': 7, 'Aug': 8,
          'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
        };
        return order[d.key];
      });
  dayChart
      .width(150)
      .height(150)
      .dimension(dayOfWeekDim)
      .group(countPerDay)
      .innerRadius(20)
      .ordering(function (d) {
        var order = {
          'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3,
          'Fri': 4, 'Sat': 5, 'Sun': 6
        }
        return order[d.key];
      }
     );
  ratingCountChart
      .width(300)
      .height(180)
      .dimension(ratingDim)
      .group(countPerRating)
      .x(d3.scale.linear().domain([0,5.2]))
      .elasticY(true)
      .centerBar(true)
      .barPadding(5)
      .xAxisLabel('My rating')
      .yAxisLabel('Count')
      .margins({top: 10, right: 20, bottom: 50, left: 50});
  ratingCountChart.xAxis().tickValues([0, 1, 2, 3, 4, 5]);
  commRatingCountChart
      .width(300)
      .height(180)
      .dimension(commRatingDim)
      .group(countPerCommRating)
      .x(d3.scale.linear().domain([0,5.2]))
      .elasticY(true)
      .centerBar(true)
      .barPadding(5)
      .xAxisLabel('Community rating')
      .yAxisLabel('Count')
      .margins({top: 10, right: 20, bottom: 50, left: 50});
  commRatingCountChart.xAxis().tickValues([0, 1, 2, 3, 4, 5]);
  abvCountChart
      .width(300)
      .height(180)
      .dimension(abvDim)
      .group(countPerABV)
      .x(d3.scale.linear().domain([-0.2, d3.max(beerData, function (d: any) { return d.beer.beer_abv; }) + 0.2]))
      .elasticY(true)
      .centerBar(true)
      .barPadding(2)
      .xAxisLabel('Alcohol By Volume (%)')
      .yAxisLabel('Count')
      .margins({top: 10, right: 20, bottom: 50, left: 50});
  ibuCountChart
      .width(300)
      .height(180)
      .dimension(ibuDim)
      .group(countPerIBU)
      .x(d3.scale.linear().domain([-2, d3.max(beerData, function (d: any) { return d.beer.beer_ibu; }) + 2]))
      .elasticY(true)
      .centerBar(true)
      .barPadding(5)
      .xAxisLabel('International Bitterness Units')
      .yAxisLabel('Count')
      .xUnits(function (d) { return 5;})
      .margins({top: 10, right: 20, bottom: 50, left: 50});
  dataCount
      .dimension(ndx)
      .group(all);


    var dateDim = ndx.dimension(function(d:any) { 
      return d3.time.month(d.first_had_dt);
    });
    var numRecordsByDate = dateDim.group().reduceCount();

    console.log(dateDim.bottom(1));

   volumeChart.width(990) /* dc.barChart('#monthly-volume-chart', 'chartGroup'); */
        .height(300)
        .margins({top: 10, right: 50, bottom: 20, left: 40})
        .dimension(dateDim)
        .group(numRecordsByDate)
        .transitionDuration(500)
        .barPadding(1)
        .elasticY(true)
        .x(d3.time.scale().domain(d3.extent(beerData, function(d: any) { return d.first_had_dt; })))
        .xAxis();


   dataTable
    .dimension(allDim)
    .group(function (d) { return 'dc.js insists on putting a row here so I remove it using JS'; })
    .size(100)
    .columns([
      function (d) { return d.brewery.brewery_name; },
      function (d) { return d.beer.beer_name; },
      function (d) { return d.beer.beer_style; },
      function (d) { return d.rating_score; },
      function (d) { return d.beer.rating_score; },
      function (d) { return d.beer.beer_abv; },
      function (d) { return d.beer.beer_ibu; }
    ])
    .sortBy(dc.pluck('rating_score'))
    .order(d3.descending)
    .on('renderlet', (table) => {
      // each time table is rendered remove nasty extra row dc.js insists on adding
      table.select('tr.dc-table-group').remove();
      // update map with breweries to match filtered data
      breweryMarkers.clearLayers();
      // _.each(allDim.top(Infinity), function (d: any) {
      //   var loc = d.brewery.location;
      //   var name = d.brewery.brewery_name;
      //   var marker = L.marker([loc.lat, loc.lng],{icon:icon});
      //   marker.bindPopup("<p>" + name + " " + loc.brewery_city + " " + loc.brewery_state + "</p>");
      //   breweryMarkers.addLayer(marker);
      // });
      //this._map.addLayer(breweryMarkers);
      //this._map.fitBounds(breweryMarkers.getBounds());

    });

    // this._map.on('moveend', (e) => {
    //   let filter = this._map.getBounds();
       
    //   console.log(filter);
    // });

    // register handlers
  d3.selectAll('a#all').on('click', function () {
    dc.filterAll();
    dc.renderAll();
  });
  d3.selectAll('a#year').on('click', function () {
    yearChart.filterAll();
    dc.redrawAll();
  });
  d3.selectAll('a#month').on('click', function () {
    monthChart.filterAll();
    dc.redrawAll();
  });
  d3.selectAll('a#day').on('click', function () {
    dayChart.filterAll();
    dc.redrawAll();
  });
  // showtime!
  dc.renderAll();

    console.log( beerData );

  }

}
