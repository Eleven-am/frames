import { Provider } from '@nestjs/common';

import { RetrieveService } from '../misc/retrieve.service';

export const ADMIN_EMAIL_SYMBOL = Symbol('ADMIN_EMAIL');
export const SHOW_FOLDER_UPDATED = 'SHOW_FOLDER_UPDATED';
export const MOVIE_FILE_UPDATED = 'MOVIE_FILE_UPDATED';

export const AdminEmailProvider: Provider = {
    provide: ADMIN_EMAIL_SYMBOL,
    inject: [RetrieveService],
    useFactory: (retrieveService: RetrieveService) => retrieveService.adminEmail.toPromise(),
};
