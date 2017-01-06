'use strict';

(function() {
    var app = angular.module('app.controllers', [])

    .controller('indexController', ['$scope',
        function($scope) {
            var self = this;
            self.init = function() {
                this.maskUrl = '';
            }
        }
    ])

    .controller('loginController', ['$scope', '$http', '$state', '$filter', 'md5', 'util',
        function($scope, $http, $state, $filter, md5, util) {
            console.log('loginController')
            var self = this;
            self.init = function() {

            }
            
            self.login = function () {
                self.loading = true;
                
                var data = JSON.stringify({
                    username: self.userName,
                    password: md5.createHash(self.password)
                })
                $http({
                    method: 'POST',
                    url: util.getApiUrl('logon', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var msg = response.data;
                    if (msg.rescode == '200') {
                        console.log(msg.token)
                        util.setParams('token', msg.token);
                        self.getEditLangs();
                    } else if (msg.rescode == "401") {
                        alert('访问超时，请重新登录');
                        $state.go('login')
                    } else {
                        alert(msg.rescode + ' ' + msg.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.loading = false;
                });
            }
            // 
            self.getEditLangs = function() {
                $http({
                    method: 'GET',
                    url: util.getApiUrl('', 'editLangs.json', 'local')
                }).then(function successCallback(response) {
                    util.setParams('editLangs', response.data.editLangs);
                    $state.go('app.projects');
                }, function errorCallback(response) {

                });
            }

        }
    ])


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, util, CONFIG) {
            var self = this;
            self.init = function() {

                // 弹窗层
                self.maskUrl = '';
                self.maskParams = {};


            }

            self.logout = function(event) {
                util.setParams('token', '');
                $state.go('login');
            }

        }
    ])

    .controller('projectsController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, NgTableParams, util, CONFIG) {
            console.log('projectsController')
            
            var self = this;
            self.init = function() {
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.getInfo();
            }

            // 获取项目列表信息
            self.getInfo = function () {
                self.noData = false;
                self.loading = true;
                self.tableParams = new NgTableParams({
                    page: 1,
                    count: 15,
                    url: ''
                }, {
                    counts: [],
                    getData: function(params) {
                        var data = {
                            "action": "xx",
                            "token": util.getParams("token"),
                            "lang": self.langStyle
                        }
                        var paramsUrl = params.url();
                        data.per_page = paramsUrl.count - 0;
                        data.page = paramsUrl.page - 0;
                        data = JSON.stringify(data);
                        return $http({
                            method: $filter('ajaxMethod')(),
                            url: util.getApiUrl('xx', '', 'server'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            if (data.data.rescode == '200') {
                                if (data.data.total == 0) {
                                    self.noData = true;
                                }
                                params.total(data.data.total);
                                return data.data.devlist;
                            } else if (msg.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $location.path("pages/login.html");
                            } else {
                                alert('读取信息出错，'+data.errInfo);
                            }

                        }, function errorCallback(data, status, headers, config) {
                            alert('连接服务器出错');
                        }).finally(function(value) {
                            self.loading = false;
                        })
                    }
                });
            }
        }
    ])  

    .controller('videosController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, util, CONFIG) {
            console.log('videosController')
            
            var self = this;
            self.init = function() {
                
            }
        }
    ])   

    .controller('appsController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, util, CONFIG) {
            console.log('appsController')
            
            var self = this;
            self.init = function() {
                
            }
        }
    ]) 

    .controller('advsController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, util, CONFIG) {
            console.log('advsController')
            
            var self = this;
            self.init = function() {
                
            }
        }
    ])  
    
})();
