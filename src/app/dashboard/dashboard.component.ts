import { Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as L from 'leaflet';
import * as _ from 'lodash';
import * as crossfilter from 'crossfilter';

import { DashboardDataService } from './dashboard-data.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [DashboardDataService]
})
export class DashboardComponent implements OnInit {

  data: any[];
  errorMessage: string;

  private _map: L.Map;

  constructor(private _dataService: DashboardDataService) {

   }

  ngOnInit(): void {

    this._map = L.map('map');
    L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 9
    }).addTo(this._map);
    this._map.setView([51.505, -0.09], 9);

    this._dataService.getData()
      .subscribe( response => this.receiveData(response),
                  error => this.errorMessage = error
      );
  }

  private receiveData( beerData: any ): void {

    let icon = L.icon({
        iconUrl: 'assets/leaflet/marker-icon.png',
        iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
        shadowUrl: 'assets/leaflet/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [13, 40]
    });

    let breweryMarkers = new L.FeatureGroup([]);
    let fullDateFormat = d3.time.format('%a, %d %b %Y %X %Z');
    let yearFormat = d3.time.format('%Y');
    let monthFormat = d3.time.format('%b');
    let dayOfWeekFormat = d3.time.format('%a');

    _.each(beerData, function(d) {
      d.count = +d.count;
      // round to nearest 0.25
      d.rating_score = Math.round(+d.rating_score * 4) / 4;
      d.beer.rating_score = Math.round(+d.beer.rating_score * 4) / 4;
      // round to nearest 0.5
      d.beer.beer_abv = Math.round(+d.beer.beer_abv * 2) / 2;
      // round to nearest 10
      d.beer.beer_ibu = Math.floor(+d.beer.beer_ibu / 10) * 10;
      d.first_had_dt = fullDateFormat.parse(d.first_had);
      d.first_had_year = +yearFormat(d.first_had_dt);
      d.first_had_month = monthFormat(d.first_had_dt);
      d.first_had_day = dayOfWeekFormat(d.first_had_dt);
    });

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
      _.each(allDim.top(Infinity), function (d: any) {
        var loc = d.brewery.location;
        var name = d.brewery.brewery_name;
        var marker = L.marker([loc.lat, loc.lng],{icon:icon});
        marker.bindPopup("<p>" + name + " " + loc.brewery_city + " " + loc.brewery_state + "</p>");
        breweryMarkers.addLayer(marker);
      });
      this._map.addLayer(breweryMarkers);
      this._map.fitBounds(breweryMarkers.getBounds());
      console.log('asd');
    });

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
