import { Provider, StorageOption } from '@eleven-am/nestjs-storage';

export const StorageOptions: StorageOption = {
    provider: Provider.LOCAL,
    options: {
        root: '/',
    },
};
