module.exports = {
    rewrites: async () => [
        {
            source: '/genres',
            destination: '/grid',
        },
        {
            source: '/decades',
            destination: '/grid',
        },
        {
            source: '/movies',
            destination: '/library',
        },
        {
            source: '/shows',
            destination: '/library',
        },
        {
            source: '/movie=:movie',
            destination: '/info'
        },
        {
            source: '/watch=:media',
            destination: '/watch'
        },
        {
            source: '/frame=:frame',
            destination: '/watch'
        },
        {
            source: '/productionCompany=:prod',
            destination: '/prod'
        },
        {
            source: '/show=:show',
            destination: '/info'
        }
    ], images: {
        domains: ['dg31sz3gwrwan.cloudfront.net', 'medias.unifrance.org', "mediad.publicbroadcasting.net", 'nino.maix.ovh', 'www.themoviedb.org', 'i.ebayimg.com', 'cdn.onebauer.media', 'drive.google.com', 'fanart.tv', 'assets.fanart.tv', 'www.neowing.co.jp', "is5-ssl.mzstatic.com", 'image.tmdb.org', 'is1-ssl.mzstatic.com', 'is4-ssl.mzstatic.com', 'is3-ssl.mzstatic.com', 'is2-ssl.mzstatic.com'],
    }, eslint: {
        ignoreDuringBuilds: true,
    }
}
