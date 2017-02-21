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
                    } 
                    else {
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

            // 添加 删除 弹窗，增加一个样式的class
            self.showHideMask = function(bool,url){
                // bool 为true时，弹窗出现
                if (bool) {
                    $scope.app.maskUrl = url;
                    $scope.app.showMaskClass = true;
                } else {
                    $scope.app.maskUrl = '';
                    $scope.app.showMaskClass = false;
                }
            }

        }
    ])

    .controller('projectsController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'NgTableParams', '$location','util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, NgTableParams,$location, util, CONFIG) {
            console.log('projectsController')
            
            var self = this;
            self.init = function() {
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.getInfo();
            }
            //添加项目
            self.add = function () {
                $scope.app.showHideMask(true,'pages/addProject.html');
            }
            //编辑项目
            self.edit = function (projectInfo) {
                $scope.app.maskParams = {'projectInfo': projectInfo};
                $scope.app.showHideMask(true,'pages/editProject.html');
            }
            // 获取项目列表信息
            self.getInfo = function () {
                self.noData = false;
                self.loading = true;
                self.tableParams = new NgTableParams({
                    page: 1,
                    count: 15, //15
                    url: ''
                }, {
                    counts: [],
                    getData: function(params) {
                        var data = {
                            "action": "projectList",
                            "token": util.getParams("token")
                        }
                        var paramsUrl = params.url();
                        data.per_page = paramsUrl.count - 0;
                        data.page = paramsUrl.page - 0;
                        data = JSON.stringify(data);
                        return $http({
                            method: $filter('ajaxMethod')(),
                            url: util.getApiUrl('project', '', 'server'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            if (data.data.rescode == '200') {
                                if (data.data.total == 0) {
                                    self.noData = true;
                                }
                                params.total(data.data.total);
                                return data.data.data;
                            } else if (data.data.rescode == '401') {
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

    .controller('addProjectController', ['$scope','$location','$http','util','$state',
        function($scope,$location,$http,util,$state) {
            var self = this;
            self.init = function() {

            }
            self.cancel = function() {
                $scope.app.showHideMask(false);
            }

            self.save = function () {
                var data = {
                    "action":"create",
                    "token":util.getParams("token"),
                    "ProjectName":self.loginName,
                    "ProjectNameCHZ":self.name,
                    "WXAppID":self.appID,
                    "WXName":self.appName
                }
                data = JSON.stringify(data);
                self.saving = true;
                $http({
                    method:'POST',
                    url:util.getApiUrl('project', '', 'server'),
                    data:data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        alert('添加成功');
                        $state.reload();
                    } else if(data.rescode == '401'){
                        alert('访问超时，请重新登录');
                        $state.go('login');
                    } else{
                        alert('添加失败，' + data.errInfo);
                    }
                },function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function (value) {
                    self.saving = false;
                });
            }
        }
    ])

    .controller('editProjectController', ['$scope','$location','$http','util','$state',
            function($scope,$location,$http,util,$state) {
                var self = this;
                self.init = function() {
                    self.cache = $scope.app.maskParams.projectInfo;
                    self.ID = self.cache.ID;
                    self.loginName = self.cache.ProjectName;
                    self.name = self.cache.ProjectNameCHZ;
                    self.appID = self.cache.WXAppID;
                    self.appName = self.cache.WXName
                }
                self.cancel = function() {
                    $scope.app.showHideMask(false);
                }

                self.save = function () {
                    var data = {
                        "action":"Edit",
                        "token":util.getParams("token"),
                        "ID":self.ID
                    }
                    var flag = false;
                    if(self.loginName != self.cache.ProjectName){
                        data.ProjectName = self.loginName;
                        flag = true
                    }
                    if(self.name != self.cache.ProjectNameCHZ){
                        data.ProjectNameCHZ = self.name;
                        flag = true
                    }
                    if(self.appID != self.cache.WXAppID){
                        data.WXAppID = self.appID;
                        flag = true
                    }
                    if(self.appName != self.cache.WXName){
                        data.WXName = self.appName;
                        flag = true
                    }
                    if(flag) {
                        data = JSON.stringify(data);
                        self.saving = true;
                        $http({
                            method: 'POST',
                            url: util.getApiUrl('project', '', 'server'),
                            data: data
                        }).then(function successCallback(response) {
                            var data = response.data;
                            if (data.rescode == '200') {
                                alert('修改成功');
                                $state.reload();
                            } else if (data.rescode == '401') {
                                alert('访问超时，请重新登录');
                                $state.go('login');
                            } else {
                                alert('修改失败，' + data.errInfo);
                            }
                        }, function errorCallback(response) {
                            alert('连接服务器出错');
                        }).finally(function (value) {
                            self.saving = false;
                        });
                    }else{
                        $scope.app.showHideMask(false);
                    }
                }
            }
    ])

    .controller('videosController', ['$http', '$scope','$location', '$state', '$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $location,$state, $filter, $stateParams, NgTableParams, util, CONFIG) {
            console.log('videosController')
            
            var self = this;
            self.init = function() {
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.getInfo();
                // checkbox
                self.checkboxes = { 'checked': false, items: {} };
            }

            self.isChecked = function() {
              var ret = false;
              var keepGoing = true;
              angular.forEach(self.checkboxes.items, function(value, key) {
                if(keepGoing) {
                  if(value === true){
                    ret = true;
                    keepGoing = false;
                  }
                }
              });
              return ret;
            }

            // watch for check all checkbox
            $scope.$watch('videos.checkboxes.checked', function(value) {
                if(self.tableData){
                    for(var i=0; i<self.tableData.length; i++) {
                        self.checkboxes.items[self.tableData[i].ProjectName] = value;
                    }
                }
                
            });

            self.send = function() {
                self.sending = true;
                var projectList = [];
                var j = 0;
                for(var item in self.checkboxes.items) {
                    if(self.checkboxes.items[item]) {
                        projectList[j] = {};
                        projectList[j++]['projectName'] = item;
                    }
                }

                var data = JSON.stringify({
                    "action": "videoUpdate",
                    "token": util.getParams("token"),
                    "projectList": projectList
                });
                $http({
                    method: $filter('ajaxMethod')(),
                    url: util.getApiUrl('submitversion', '', 'server'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                        alert('发布成功');
                    } else if (data.data.rescode == '401') {
                        alert('访问超时，请重新登录');
                        $location.path("pages/login.html");
                    } else {
                        alert('发布失败，'+data.errInfo);
                    }

                }, function errorCallback(data, status, headers, config) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.sending = false;
                })
            }

            // 获取项目列表信息
            self.getInfo = function () {
                self.noData = false;
                self.loading = true;
                self.tableParams = new NgTableParams({
                    page: 1,
                    count: 15, //15
                    url: ''
                }, {
                    counts: [],
                    getData: function(params) {
                        var data = {
                            "action": "projectList",
                            "token": util.getParams("token")
                        }
                        var paramsUrl = params.url();
                        data.per_page = paramsUrl.count - 0;
                        data.page = paramsUrl.page - 0;
                        data = JSON.stringify(data);
                        return $http({
                            method: $filter('ajaxMethod')(),
                            url: util.getApiUrl('project', '', 'server'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            if (data.data.rescode == '200') {
                                if (data.data.total == 0) {
                                    self.noData = true;
                                }
                                params.total(data.data.total);
                                self.tableData = data.data.data;
                                return data.data.data;
                            } else if (data.data.rescode == '401') {
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
    
    // 音乐库
    .controller('musicsController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, NgTableParams, util, CONFIG) {
            console.log('musicsController')
            
            var self = this;
            self.init = function() {
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.getInfo();
                // checkbox
                self.checkboxes = { 'checked': false, items: {} };
            }

            self.isChecked = function() {
              var ret = false;
              var keepGoing = true;
              angular.forEach(self.checkboxes.items, function(value, key) {
                if(keepGoing) {
                  if(value === true){
                    ret = true;
                    keepGoing = false;
                  }
                }
              });
              return ret;
            }

            // watch for check all checkbox
            $scope.$watch('musics.checkboxes.checked', function(value) {
                if(self.tableData){
                    for(var i=0; i<self.tableData.length; i++) {
                        self.checkboxes.items[self.tableData[i].ProjectName] = value;
                    }
                }
                
            });

            self.send = function() {
                self.sending = true;
                var projectList = [];
                var j = 0;
                for(var item in self.checkboxes.items) {
                    if(self.checkboxes.items[item]) {
                        projectList[j] = {};
                        projectList[j++]['projectName'] = item;
                    }
                }

                var data = JSON.stringify({
                    "action": "musicUpdate",
                    "token": util.getParams("token"),
                    "projectList": projectList
                });
                $http({
                    method: $filter('ajaxMethod')(),
                    url: util.getApiUrl('submitversion', '', 'server'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                        alert('发布成功');
                    } else if (data.data.rescode == '401') {
                        alert('访问超时，请重新登录');
                        $location.path("pages/login.html");
                    } else {
                        alert('发布失败，'+data.errInfo);
                    }

                }, function errorCallback(data, status, headers, config) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.sending = false;
                })
            }

            // 获取项目列表信息
            self.getInfo = function () {
                self.noData = false;
                self.loading = true;
                self.tableParams = new NgTableParams({
                    page: 1,
                    count: 15, //15
                    url: ''
                }, {
                    counts: [],
                    getData: function(params) {
                        var data = {
                            "action": "projectList",
                            "token": util.getParams("token")
                        }
                        var paramsUrl = params.url();
                        data.per_page = paramsUrl.count - 0;
                        data.page = paramsUrl.page - 0;
                        data = JSON.stringify(data);
                        return $http({
                            method: $filter('ajaxMethod')(),
                            url: util.getApiUrl('project', '', 'server'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            if (data.data.rescode == '200') {
                                if (data.data.total == 0) {
                                    self.noData = true;
                                }
                                params.total(data.data.total);
                                self.tableData = data.data.data;
                                return data.data.data;
                            } else if (data.data.rescode == '401') {
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

    .controller('appsController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, NgTableParams, util, CONFIG) {
            console.log('appsController')
            
            var self = this;
            self.init = function() {
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.getInfo();
                // checkbox
                self.checkboxes = { 'checked': false, items: {} };
            }

            self.isChecked = function() {
              var ret = false;
              var keepGoing = true;
              angular.forEach(self.checkboxes.items, function(value, key) {
                if(keepGoing) {
                  if(value === true){
                    ret = true;
                    keepGoing = false;
                  }
                }
              });
              return ret;
            }

            // watch for check all checkbox
            $scope.$watch('apps.checkboxes.checked', function(value) {
                if(self.tableData){
                    for(var i=0; i<self.tableData.length; i++) {
                        self.checkboxes.items[self.tableData[i].ProjectName] = value;
                    }
                }
                
            });

            self.send = function() {
                self.sending = true;
                var projectList = [];
                var j = 0;
                for(var item in self.checkboxes.items) {
                    if(self.checkboxes.items[item]) {
                        projectList[j] = {};
                        projectList[j++]['projectName'] = item;
                    }
                }

                var data = JSON.stringify({
                    "action": "appUpdate",
                    "token": util.getParams("token"),
                    "projectList": projectList
                });
                $http({
                    method: $filter('ajaxMethod')(),
                    url: util.getApiUrl('submitversion', '', 'server'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                        alert('发布成功');
                    } else if (data.data.rescode == '401') {
                        alert('访问超时，请重新登录');
                        $location.path("pages/login.html");
                    } else {
                        alert('发布失败，'+data.errInfo);
                    }

                }, function errorCallback(data, status, headers, config) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.sending = false;
                })
            }

            // 获取项目列表信息
            self.getInfo = function () {
                self.noData = false;
                self.loading = true;
                self.tableParams = new NgTableParams({
                    page: 1,
                    count: 15, //15
                    url: ''
                }, {
                    counts: [],
                    getData: function(params) {
                        var data = {
                            "action": "projectList",
                            "token": util.getParams("token")
                        }
                        var paramsUrl = params.url();
                        data.per_page = paramsUrl.count - 0;
                        data.page = paramsUrl.page - 0;
                        data = JSON.stringify(data);
                        return $http({
                            method: $filter('ajaxMethod')(),
                            url: util.getApiUrl('project', '', 'server'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            if (data.data.rescode == '200') {
                                if (data.data.total == 0) {
                                    self.noData = true;
                                }
                                params.total(data.data.total);
                                self.tableData = data.data.data;
                                return data.data.data;
                            } else if (data.data.rescode == '401') {
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

    .controller('advsController', ['$http', '$scope', '$state','$location', '$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, NgTableParams, util, CONFIG) {
            console.log('advsController')
            
            var self = this;
            self.init = function() {
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.getInfo();
                // checkbox
                self.checkboxes = { 'checked': false, items: {} };
            }

            self.isChecked = function() {
              var ret = false;
              var keepGoing = true;
              angular.forEach(self.checkboxes.items, function(value, key) {
                if(keepGoing) {
                  if(value === true){
                    ret = true;
                    keepGoing = false;
                  }
                }
              });
              return ret;
            }

            // watch for check all checkbox
            $scope.$watch('advs.checkboxes.checked', function(value) {
                if(self.tableData){
                    for(var i=0; i<self.tableData.length; i++) {
                        self.checkboxes.items[self.tableData[i].ProjectName] = value;
                    }
                }
                
            });

            self.send = function() {
                self.sending = true;
                var projectList = [];
                var j = 0;
                for(var item in self.checkboxes.items) {
                    if(self.checkboxes.items[item]) {
                        projectList[j] = {};
                        projectList[j++]['projectName'] = item;
                    }
                }

                var data = JSON.stringify({
                    "action": "advUpdate",
                    "token": util.getParams("token"),
                    "projectList": projectList
                });
                $http({
                    method: $filter('ajaxMethod')(),
                    url: util.getApiUrl('submitversion', '', 'server'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                        alert('发布成功');
                    } else if (data.data.rescode == '401') {
                        alert('访问超时，请重新登录');
                        $location.path("pages/login.html");
                    } else {
                        alert('发布失败，'+data.errInfo);
                    }

                }, function errorCallback(data, status, headers, config) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.sending = false;
                })
            }

            // 获取项目列表信息
            self.getInfo = function () {
                self.noData = false;
                self.loading = true;
                self.tableParams = new NgTableParams({
                    page: 1,
                    count: 15, //15
                    url: ''
                }, {
                    counts: [],
                    getData: function(params) {
                        var data = {
                            "action": "projectList",
                            "token": util.getParams("token")
                        }
                        var paramsUrl = params.url();
                        data.per_page = paramsUrl.count - 0;
                        data.page = paramsUrl.page - 0;
                        data = JSON.stringify(data);
                        return $http({
                            method: $filter('ajaxMethod')(),
                            url: util.getApiUrl('project', '', 'server'),
                            data: data
                        }).then(function successCallback(data, status, headers, config) {
                            if (data.data.rescode == '200') {
                                if (data.data.total == 0) {
                                    self.noData = true;
                                }
                                params.total(data.data.total);
                                self.tableData = data.data.data;
                                return data.data.data;
                            } else if (data.data.rescode == '401') {
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
    
})();
