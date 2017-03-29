import { Injectable } from '@angular/core';
import * as L from 'leaflet';

import { IMediaData } from '../interfaces/media-data';
import { LeafletVectorIcon } from '../classes/leaflet-vector-icon';

@Injectable()
export class DashboardMapService {

  private _map: L.Map;
  private _mapOptions: L.MapOptions = {
    attributionControl: false,
    center: [52.4569312, 13.5264438],
    zoom: 9
  };
  private _tileLayer = {
    url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    options: <L.TileLayerOptions>{
      maxZoom: 18
    }
  };
  private _icon = new LeafletVectorIcon({markerColor:'green'});
  private _mediaMarkers = new L.FeatureGroup([]);


  constructor() {}

  createMap( identifier: string = 'map', options: L.MapOptions = this._mapOptions ): void {

    this._map = L.map(identifier, options);
    L.tileLayer(this._tileLayer.url, this._tileLayer.options).addTo( this._map );

  }

  updateMarker( mediaData: IMediaData[] ): void {

    this._mediaMarkers.clearLayers();
    for ( const mediaElement of mediaData ){
        this._mediaMarkers.addLayer(L.marker([mediaElement.location.lat, mediaElement.location.lng], {icon: this._icon}));
    }
    if (!!this._mediaMarkers.getLayers().length) {
      this._map.addLayer(this._mediaMarkers);
      this._map.fitBounds(this._mediaMarkers.getBounds());
    }

  }

}
