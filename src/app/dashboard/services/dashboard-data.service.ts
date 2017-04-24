import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';
import * as d3 from 'd3';

import { IRawMediaData, IMediaData } from '../interfaces/media-data';

@Injectable()
export class DashboardDataService {

  private _dataUrl = 'assets/sample_data/sample-media.json';

  constructor(private _http: Http) { }

  getData(): Observable<IMediaData[]> {
      return this._http.get(this._dataUrl)
          .map((response: Response) => this.prepareData(<IRawMediaData[]> response.json()))
          .do(data => data)
          .catch(this.handleError);
  }

  private prepareData( mediadata: IRawMediaData[] ): IMediaData[] {
    for ( const mediaElement of mediadata ){
        (<IMediaData>mediaElement).date = d3.time.format.iso.parse(mediaElement.timestamp);
    }
    return <IMediaData[]> mediadata;
  }

  private handleError(error: Response) {
      console.error(error);
      return Observable.throw(error.json().error || 'Server error');
  }

}
