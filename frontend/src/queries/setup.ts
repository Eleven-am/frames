import { setupProvider } from '@/providers/setupProvider';
import { createMutations, createQueries } from '@/queries/base';

export type OpenSubtitles = {
    username: string;
    password: string;
    userAgent: string;
}

export type MailServer = {
    host: string;
    port: string;
    user: string;
    pass: string;
    domain: string;
}

const nextProcess = setupProvider.nextProcess.bind(setupProvider);

export const setupQueries = createQueries('setup', {
    carousel: (enabled: boolean) => ({
        enabled,
        initialData: [],
        queryFn: (api) => api.setupControllerGetTrendingBackdrops(),
    }),
    readFolder: (path: string | null, cloudStorageId: string) => ({
        queryKey: [path, cloudStorageId],
        queryFn: (api) => api.setupControllerExploreFolder({
            path: path || '',
            cloudStorageId,
        }),
    }),
});

export const setupMutations = createMutations({
    saveTmdbConfig: {
        mutationFn: (client, tmdbApiKey: string) => client.setupControllerCreateTmdbConfig({
            tmdbApiKey,
        }),
        onSuccess: nextProcess,
    },
    saveFanArtTvConfig: {
        mutationFn: (client, fanArtTvApiKey: string) => client.setupControllerCreateFanArtTvConfig({
            fanArtTvApiKey,
        }),
        onSuccess: nextProcess,
    },
    saveOpenAiConfig: {
        mutationFn: (client, openAIApiKey: string) => client.setupControllerCreateOpenAiConfig({
            openAiApiKey: openAIApiKey,
        }),
        onSuccess: nextProcess,
    },
    saveOpenSubtitlesConfig: {
        mutationFn: (client, openSubtitles: OpenSubtitles) => client.setupControllerCreateOpenSubtitlesConfig(openSubtitles),
        onSuccess: nextProcess,
    },
    saveMailConfig: {
        mutationFn: (client, value: MailServer) => client.setupControllerCreateMailConfig({
            host: value.host,
            port: parseInt(value.port, 10),
            user: value.user,
            pass: value.pass,
            domain: value.domain,
        }),
        onSuccess: nextProcess,
    },
});
