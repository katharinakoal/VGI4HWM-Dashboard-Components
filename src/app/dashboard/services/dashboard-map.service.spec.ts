import { TestBed, inject } from '@angular/core/testing';

import { DashboardMapService } from './dashboard-map.service';

describe('DashboardMapService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardMapService]
    });
  });

  it('should ...', inject([DashboardMapService], (service: DashboardMapService) => {
    expect(service).toBeTruthy();
  }));
});
