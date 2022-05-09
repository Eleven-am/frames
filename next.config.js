//const withPWA = require('next-pwa');

module.exports = {
    /*reactStrictMode: true, pwa: {
        dest: 'public', disable: process.env.NODE_ENV === 'development', register: true, skipWaiting: true,
    },*/
    rewrites: async () => [{
        source: '/movies', destination: '/library',
    }, {
        source: '/shows', destination: '/library',
    }, {
        source: '/movie=:movie', destination: '/info'
    }, {
        source: '/watch=:auth', destination: '/watch'
    }, {
        source: '/frame=:frame', destination: '/watch'
    }, {
        source: '/room=:roomKey', destination: '/watch'
    }, {
        source: '/collection=:collectionName', destination: '/collection'
    }, {
        source: '/productionCompany=:prod', destination: '/prod'
    }, {
        source: '/person=:person', destination: '/person'
    }, {
        source: '/show=:show', destination: '/info'
    }], images: {
        domains: ['dg31sz3gwrwan.cloudfront.net', 'medias.unifrance.org', "mediad.publicbroadcasting.net", 'nino.maix.ovh', 'www.themoviedb.org', 'i.ebayimg.com', 'cdn.onebauer.media', 'drive.google.com', 'fanart.tv', 'assets.fanart.tv', 'www.neowing.co.jp', "is5-ssl.mzstatic.com", 'image.tmdb.org', 'is1-ssl.mzstatic.com', 'is4-ssl.mzstatic.com', 'is3-ssl.mzstatic.com', 'is2-ssl.mzstatic.com'],
    }, eslint: {
        ignoreDuringBuilds: true,
    },
};
