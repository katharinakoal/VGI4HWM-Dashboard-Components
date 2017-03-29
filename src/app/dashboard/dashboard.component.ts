import { Component, OnInit} from '@angular/core';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as L from 'leaflet';
import * as crossfilter from 'crossfilter';

import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardMapService } from './services/dashboard-map.service';
import { IMediaData, IMediaCategory } from './interfaces/media-data';


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
    const categoryDim = cf.dimension((d: IMediaData) => {
      d.category.valueOf = () => d.category.id;
      return d.category;
    });

    for ( const group of categoryDim.group().all() ){
      console.log(group.key.longname);
      let c = categoryDim.filter(group.key);
      console.log(c.top(Infinity));
    }

    /** marked for refactoring */
    categoryDim.filterAll();

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
}
