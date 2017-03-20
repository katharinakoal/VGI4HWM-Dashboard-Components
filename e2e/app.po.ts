import { browser, element, by } from 'protractor';

export class VGI4HWMDashboardComponentsPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('app-root h1')).getText();
  }
}
