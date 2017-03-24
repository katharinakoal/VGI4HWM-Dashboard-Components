import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/throw';

import { IRawMediaData } from '../interfaces/raw-media-data';

@Injectable()
export class DashboardDataService {

  private _dataUrl = 'sample_data/sample-media.json';

  constructor(private _http: Http) { }

  getData(): Observable<IRawMediaData[]> {
      return this._http.get(this._dataUrl)
          .map((response: Response) => <IRawMediaData[]> response.json())
          .do(data => data)
          .catch(this.handleError);
  }

  private handleError(error: Response) {
      console.error(error);
      return Observable.throw(error.json().error || 'Server error');
  }

}
