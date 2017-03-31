import { Component, OnInit } from '@angular/core';
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
  categories: Array<IMediaCategory & { color: string, active: boolean }>;
  private _categoryDim: CrossFilter.Dimension<IMediaData, IMediaCategory>;

  private _timeChart: dc.BarChart;

  constructor(private _dataService: DashboardDataService, private _mapService: DashboardMapService) { }

  ngOnInit(): void {

    this._mapService.createMap();
    this._dataService.getData()
      .subscribe(response => this.receiveData(response),
      error => this.errorMessage = error
      );
    this.categories = new Array();

  }

  private receiveData(mediaData: IMediaData[]): void {

    const fullDateFormat = d3.time.format.iso;
    const colors = d3.scale.category10();

    for (const mediaElement of mediaData) {
      (<IMediaData>mediaElement).date = d3.time.format.iso.parse(mediaElement.timestamp);
    }

    const cf = crossfilter(mediaData as IMediaData[]);

    const allDim = cf.dimension((d: IMediaData) => d);
    const dateDim = cf.dimension((d: IMediaData) => d.date);
    this._categoryDim = cf.dimension((d: IMediaData) => {
      d.category.valueOf = () => d.category.id;
      return d.category;
    });
    const dateGroup = dateDim.group();
    const categoryGroup = this._categoryDim.group();

    const categoryCounts = {};

    categoryGroup.all().forEach((group, index) => {
      categoryCounts[group.key.shortname] = 0;
      const color = index in colors.range() ? colors.range()[index] : '#000';
      this.categories.push( Object.assign(group.key, {color: color, active: true}) );
    });

    this._mapService.addMarkerGroups( this.categories );

    console.log(this.categories);

    const categoryByDate = dateDim.group().reduce(
      (p, v) => {
        p[v.category.shortname]++;
        return p;
      },
      (p, v) => {
        p[v.category.shortname]--;
        return p;
      },
      () => Object.assign({}, categoryCounts)
    );

    this._timeChart = dc.barChart('#time-chart');

    this._timeChart.on('renderlet', () => this._mapService.updateMarker(allDim.top(Infinity)))
      .height(180)
      .margins({ top: 20, right: 0, bottom: 20, left: 25 })
      .dimension(dateDim)
      .barPadding(2)
      .transitionDuration(200)
      .centerBar(true)
      .elasticY(true)
      .x(d3.time.scale().domain([
        d3.time.day.offset(d3.min(mediaData, (d: IMediaData) => d.date), -1),
        d3.time.day.offset(d3.max(mediaData, (d: IMediaData) => d.date), 1)
      ]))
      .xUnits(function () { return 20; })
      .colors(colors);

    categoryGroup.all().forEach((group, index) => {

      if (!!index) {
        this._timeChart.stack(categoryByDate, group.key.shortname, function (d) {
          return d.value[group.key.shortname];
        });
      } else {
        this._timeChart.group(categoryByDate).valueAccessor(function (d) {
          return d.value[group.key.shortname];
        });
      }

    });

    // const test = categoryGroup.all()[2];
    // categoryDim.filter(test.key);

    dc.renderAll();
  }

  public onResize(event): void {
    this._timeChart.render();
  }

  public updateCategoryFilter(option, event): void {
    const selection = this.categories.filter((e) => e.active);
    this._categoryDim.filterAll().filter( (f) => {
      return -1 !== selection.findIndex((g) => g.id === f.id);
    });
    dc.redrawAll();
  }

}
