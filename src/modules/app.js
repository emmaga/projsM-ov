'use strict';

(function () {
    var app = angular.module('openvod', [
        'ui.router',
        'pascalprecht.translate',
        'app.controllers',
        'app.filters',
        'app.directives',
        'app.services',
        'angular-md5',
        'ngCookies',
        'ngTable',
        'ui.toggle',
        'ui.bootstrap',
        'ui.bootstrap.datetimepicker',
        'ng-fusioncharts'
    ])
    
    .config(['$translateProvider', function ($translateProvider) {
        var lang = navigator.language.indexOf('zh') > -1 ? 'zh-CN' : 'en-US';
        $translateProvider.preferredLanguage(lang);
        $translateProvider.useStaticFilesLoader({
            prefix: 'i18n/',
            suffix: '.json'
        });
    }])

    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/login');
        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'pages/login.html'
            })
            .state('app', {
                url: '/app',
                templateUrl: 'pages/app.html'
            })
            .state('app.projects', {
                url: '/projects',
                templateUrl: 'pages/projects.html'
            })
            .state('app.videos', {
                url: '/videos',
                templateUrl: 'pages/videos.html'
            })
            .state('app.musics', {
                url: '/musics',
                templateUrl: 'pages/musics.html'
            })
            .state('app.advs', {
                url: '/advs',
                templateUrl: 'pages/advs.html'
            })
            .state('app.apps', {
                url: '/apps',
                templateUrl: 'pages/apps.html'
            })
            .state('app.online', {
                url: '/online',
                templateUrl: 'pages/online.html'
            })
            .state('app.moviePay', {
                url: '/moviePay',
                templateUrl: 'pages/moviePay.html'
            })
            // .state('app.proxy', {
            //     url: '/proxy',
            //     templateUrl: 'pages/proxy.html'
            // })
    }])


    .constant('CONFIG', {
        // serverUrl: 'http://openvod.cleartv.cn/backend_clearmgt/v1/',
        serverUrl: 'http://172.16.1.21/backend_clearmgt/v1/',
        uploadImgUrl: 'http://mres.cleartv.cn/upload',
        uploadVideoUrl: 'http://movies.clearidc.com/upload',
        testUrl: 'test/',
        test: false
    })

})();