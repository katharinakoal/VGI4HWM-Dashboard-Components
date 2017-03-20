import { VGI4HWMDashboardComponentsPage } from './app.po';

describe('vgi4-hwm-dashboard-components App', () => {
  let page: VGI4HWMDashboardComponentsPage;

  beforeEach(() => {
    page = new VGI4HWMDashboardComponentsPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
