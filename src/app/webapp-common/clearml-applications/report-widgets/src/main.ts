import {APP_BASE_HREF} from '@angular/common';
import {bootstrapApplication} from '@angular/platform-browser';
import {environment} from './environments/environment';
import {updateHttpUrlBaseConstant} from '~/app.constants';
import {appConfig} from '@common/clearml-applications/report-widgets/src/app/app.config';
import {Environment} from '../../../../../environments/base';
import {AppComponent} from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));


(async () => {
  const configData = {baseHref: ''} as Environment;
  try {
    // configData = await fetchConfigOutSideAngular();
    (window as any).configuration = {};
  } finally {
    updateHttpUrlBaseConstant({...environment, ...configData});
    await bootstrapApplication(AppComponent, {providers: [
        ...appConfig.providers,
        {provide: APP_BASE_HREF, useValue: configData.baseHref}
      ]});
  }
})();
