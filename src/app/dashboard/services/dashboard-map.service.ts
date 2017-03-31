import { Injectable } from '@angular/core';
import * as L from 'leaflet';

import { IMediaData, IMediaCategory } from '../interfaces/media-data';
import { LeafletVectorIcon } from '../classes/leaflet-vector-icon';

type MarkerGroup = IMediaCategory & { icon: L.Icon };
type MediaCategoryExtended = IMediaCategory & { color: string, active: boolean };

interface MediaMarker {
  marker: L.Marker;
  data: IMediaData;
  active: boolean;
}

@Injectable()
export class DashboardMapService {

  private _selection: Array<MediaMarker>;

  private _map: L.Map;
  private _mapOptions: L.MapOptions = {
    attributionControl: false,
    center: [52.4569312, 13.5264438],
    zoom: 9,
  };
  private _tileLayer = {
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: <L.TileLayerOptions>{
      maxZoom: 18
    }
  };
  private _mediaMarkers: L.FeatureGroup;
  private _markerGroups: Array<MarkerGroup>;

  public get selection(): IMediaData[] {

    const single_index = this._selection.findIndex((e) => e.active );

    return -1 !== single_index ? [this._selection[single_index].data] : this._selection.map((e) => e.data);
  }

  constructor() {
    this._selection = new Array();
  }

  createMap(identifier: string = 'map', options: L.MapOptions = this._mapOptions): void {

    this._map = L.map(identifier, options);
    L.tileLayer(this._tileLayer.url, this._tileLayer.options).addTo(this._map);
    this._mediaMarkers = new L.FeatureGroup([]);
    this._markerGroups = new Array();

  }

  updateMarker(mediaData: IMediaData[]): void {

    this._mediaMarkers.clearLayers();
    this._selection = [];
    for (const mediaElement of mediaData) {
      const marker = L.marker([mediaElement.location.lat, mediaElement.location.lng]);
      const group = this._markerGroups.find((e) => e.id === mediaElement.category.id);
      if (group) {
        marker.setIcon(group.icon);
      }
      this._mediaMarkers.addLayer(marker);
      marker.on('click', (e) => this.highlightMarker(e));
      this._selection.push({
        data: mediaElement,
        marker: marker,
        active: false
      });
    }
    if (!!this._mediaMarkers.getLayers().length) {
      this._map.addLayer(this._mediaMarkers);
      this._map.fitBounds(this._mediaMarkers.getBounds(), { paddingTopLeft: [0, 50] });
    }

  }

  addMarkerGroups(categories: MediaCategoryExtended[]): void {
    for (const category of categories) {
      this._markerGroups.push(
        Object.assign(
          { icon: new LeafletVectorIcon({ markerColor: category.color }) },
          category
        )
      );
    }
  }

  private highlightMarker(e: any): void {

    const currentMarker = this._selection.find((s: MediaMarker) => s.marker === e.target );

    if ( currentMarker.active ) {
      currentMarker.active = false;
      this._mediaMarkers.eachLayer((y) => {
        (<L.Marker>y).setOpacity(1);
      });
    } else {
      for ( const mediaMarker of this._selection ){
        mediaMarker.active = false;
        mediaMarker.marker.setOpacity(.3);
      }
      currentMarker.active = true;
      currentMarker.marker.setOpacity(1);
    }
  }

}
