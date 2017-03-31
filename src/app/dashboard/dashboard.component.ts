import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import * as dc from 'dc';
import * as L from 'leaflet';
import * as crossfilter from 'crossfilter';

import { DashboardDataService } from './services/dashboard-data.service';
import { DashboardMapService } from './services/dashboard-map.service';
import { IMediaData, IMediaCategory } from './interfaces/media-data';

type MediaCategoryExtended = IMediaCategory & { color: string, active: boolean };

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [DashboardDataService, DashboardMapService]
})
export class DashboardComponent implements OnInit {

  public errorMessage: string;
  public categories: Array<MediaCategoryExtended>;
  public get selection(): Array<IMediaData>{
    return this._mapService.selection;
  }

  private _allDim: CrossFilter.Dimension<IMediaData, IMediaData>;
  private _dateDim: CrossFilter.Dimension<IMediaData, Date>;
  private _categoryDim: CrossFilter.Dimension<IMediaData, IMediaCategory>;

  private _timeChart: dc.BarChart;

  private _colors: d3.scale.Ordinal<string, string> = d3.scale.category10();

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

    for (const mediaElement of mediaData) {
      (<IMediaData>mediaElement).date = d3.time.format.iso.parse(mediaElement.timestamp);
    }

    const cf = crossfilter(mediaData as IMediaData[]);

    this._allDim = cf.dimension((d: IMediaData) => d);
    this._dateDim = cf.dimension((d: IMediaData) => d.date);
    this._categoryDim = cf.dimension((d: IMediaData) => {
      d.category.valueOf = () => d.category.id;
      return d.category;
    });
    const dateGroup = this._dateDim.group();
    const categoryGroup = this._categoryDim.group();

    const categoryCounts = {};

    categoryGroup.all().forEach((group, index) => {
      categoryCounts[group.key.shortname] = 0;
      const color = index in this._colors.range() ? this._colors.range()[index] : '#000';
      this.categories.push( Object.assign(group.key, {color: color, active: true}) );
    });

    this._mapService.addMarkerGroups( this.categories );

    const categoryByDate = this._dateDim.group().reduce(
      (p: any, v: IMediaData) => {
        p[v.category.shortname]++;
        return p;
      },
      (p: any, v: IMediaData) => {
        p[v.category.shortname]--;
        return p;
      },
      () => Object.assign({}, categoryCounts)
    );

    this._timeChart = dc.barChart('#time-chart');

    this._timeChart.on('renderlet', () => this._mapService.updateMarker(this._allDim.top(Infinity)))
      .height(180)
      .margins({ top: 20, right: 0, bottom: 20, left: 25 })
      .dimension(this._dateDim)
      .barPadding(2)
      .transitionDuration(200)
      .centerBar(true)
      .elasticY(true)
      .x(d3.time.scale.utc().domain([
        d3.time.day.offset(d3.min(mediaData, (d: IMediaData) => d.date), -1),
        d3.time.day.offset(d3.max(mediaData, (d: IMediaData) => d.date), 1)
      ]))
      .xUnits(function () { return 20; })
      .colors(this._colors);

    this._timeChart.filterAll();

    categoryGroup.all().forEach((group, index: number) => {

      if (!!index) {
        this._timeChart.stack(categoryByDate, group.key.shortname, function (d: any) {
          return d.value[group.key.shortname];
        });
      } else {
        this._timeChart.group(categoryByDate).valueAccessor(function (d: any) {
          return d.value[group.key.shortname];
        });
      }

    });

    dc.renderAll();

  }

  public onResize(event: Event): void {
    this._timeChart.render();
  }

  public resetTimeChart(): void {
    this._timeChart.filterAll();
    dc.redrawAll();
  }

  public updateCategoryFilter(option, event): void {
    const selection = this.categories.filter((categorySelect: MediaCategoryExtended): boolean => categorySelect.active);
    this._categoryDim.filterAll().filter( (categoryAll: IMediaCategory): boolean => {
      return -1 !== selection.findIndex((categorySelected: MediaCategoryExtended): boolean => categorySelected.id === categoryAll.id);
    });
    dc.redrawAll();
  }

}
