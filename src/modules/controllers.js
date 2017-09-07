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
                    $state.go('app.online');
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


    .controller('proxyController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'NgTableParams', '$location','util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, NgTableParams,$location, util, CONFIG) {
            var self = this;
            self.init = function() {
                self.projectName = $scope.app.maskParams.ProjectName;
                self.ProjectNameCHZ = $scope.app.maskParams.ProjectNameCHZ;
                self.editLangs = util.getParams('editLangs')
                self.defaultLang = util.getDefaultLangCode();
                self.page = 1;
                self.per_page = 5;
                self.total = 0;
                self.totalPage = 1;
                self.noData = false;
                self.loading = true;
                self.getInfo();
            }

            self.proTypeList = [
                {id: 0, value: '测试项目'},
                {id: 1, value: '正式项目'},
            ]

            self.cancel = function() {
                $scope.app.showHideMask(false);
            }

            self.next = function(){
                self.page = self.page + 1;
                if(self.page > self.totalPage)
                    self.page = self.totalPage;
                self.getInfo(); 
            }

            self.back = function(){
                self.page = (self.page - 1) <=1  ? 1 : (self.page - 1);
                self.getInfo(); 
            }

            // 获取小前端状态列表信息
            self.getInfo = function () {
                var data = {
                    "action": "getProjectServerList",
                    "token": util.getParams("token"),
                    "project": self.projectName,
                    "per_page":self.per_page,
                    "page":self.page
                }
                $http({
                    method: $filter('ajaxMethod')(),
                    url: util.getApiUrl('project', '', 'server'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {
                        if (data.data.total == 0) {
                            self.noData = true;
                        }
                        self.serverVersion = data.data.serverVersion;
                        self.total = data.data.total;
                        self.totalPage = parseInt(self.total/self.per_page) + 1;
                        self.list = data.data.data;
                        self.listState = [];
                        self.list.forEach(function(value, index, array){
                            self.listState.push(false)
                        })
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

            $scope.toggleDetail = function(index) {  
                self.listState[index] = !self.listState[index];
            }
            
            $scope.TypeChanged = function ($index) {
                var data = JSON.stringify({
                    action: "setServerType",
                    token: util.getParams("token"),
                    project: self.projectName,
                    type: self.list[$index].Type,
                    ID: self.list[$index].ID,
                })
                $http({
                    method: 'post',
                    url: util.getApiUrl('project', '', 'server'),
                    data: data
                }).then(function successCallback(data, status, headers, config) {
                    if (data.data.rescode == '200') {

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
        }
    ])

    .controller('projectsController', ['$http', '$scope', '$state', '$filter', '$stateParams', 'NgTableParams', '$location','util', 'CONFIG',
        function($http, $scope, $state, $filter, $stateParams, NgTableParams,$location, util, CONFIG) {
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

            /**
             * 查询小前端
             * @param project
             */
            self.queryProxy = function(ProjectName, ProjectNameCHZ) {
                $scope.app.maskParams = {'ProjectName': ProjectName, 'ProjectNameCHZ': ProjectNameCHZ};
                $scope.app.showHideMask(true, 'pages/proxy.html');
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
                                self.list = data.data.data;
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
    
    .controller('onlineController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;

            moment.locale('zh-cn');
            $scope.startDateBeforeRender = startDateBeforeRender;
            $scope.startDateOnSetTime = startDateOnSetTime;

            function startDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('.dropdown-toggle')).click();  
              $scope.$broadcast('start-date-changed');
              self.search();
            }

            function startDateBeforeRender ($dates) {
              if ($scope.dateRangeStart) {
                var activeDate = moment($scope.dateRangeStart);

                $dates.filter(function (date) {
                  return date.localDateValue() >= activeDate.valueOf()
                }).forEach(function (date) {
                  date.selectable = false;
                })
              }
            }


            self.init = function() {
                self.searchVal = {};
                self.queryType = [{value: '0', name: '按日查询'}, {value: '1', name: '按小时查询'}];
                self.searchVal.queryType = '0'
                self.hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 24];
                self.searchVal.hours = '7';
                $scope.dateRangeStart = $filter('date')(new Date() + 1*24*60*60*1000, 'yyyy-MM-dd');
                self.searchDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
                self.searchDateTime = $filter('date')((new Date().getTime()), 'yyyy-MM-dd HH') + ":00";
                self.duration = "7";
                self.initChart();
                self.loadOnline().then(function(){
                    return self.loadProList()
                }).then(function() {
                    return self.search();
                });
                self.orderby = {};
                self.orderby.desc = false;
            }

            self.initAttrs = function () {
                $scope.attrs = {
                    "caption": "上线情况统计",
                    "numberprefix": "",
                    "yAxisname": "终端数（个）",
                    "xAxisName": self.xAxisName,
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
            }

            self.initChart = function () {
                self.xAxisName = "日期";
                self.initAttrs();

                $scope.categories = [
                    {
                        "category": [
                        ]
                    }
                ];
                $scope.dataset = [];
            }

            self.loadProList = function () {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'projectNameList'
                })
                self.loadingProList = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('project', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.searchVal.projects = [];
                        self.searchVal.projects[0] = {value: 'all', name: '全部项目'};
                        data.data.forEach(function(item, index, array) {
                            self.searchVal.projects.push({ value:item.ProjectName , name: item.ProjectNameCHZ });
                            self.searchVal.project = 'all';
                        })
                        deferred.resolve();
                    } else if (data.rescode == '401') {
                        alert('访问超时，请重新登录');
                        $location.path("pages/login.html");
                    } else {
                        alert(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }

                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingProList = false;
                });
                return deferred.promise;
            }

            self.loadOnline = function () {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getTermOnlineInfo'
                })
                self.loadingOnline = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.onlineCount = data.onlineCount;
                        self.totalCount = data.totalCount;
                        self.totalProjectCount = data.totalProjectCount == undefined? 0: data.totalProjectCount;
                        deferred.resolve();
                    } else if (data.rescode == '401') {
                        alert('访问超时，请重新登录');
                        $location.path("pages/login.html");
                        deferred.reject();
                    }
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingOnline = false;
                    deferred.reject();
                });
                return deferred.promise;
            }

            self.search = function () {
                switch (self.searchVal.queryType) {
                    case '0': var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermLoginInfo',
                        endDate: self.searchDate + ' 00:00:00',
                        project: self.searchVal.project,
                        days: Number(self.duration)
                    })
                    break;
                    case '1': var data = JSON.stringify({
                        token: util.getParams("token"),
                        action: 'getTermHourLoginInfo',
                        endTime: self.searchDateTime + ':00',
                        project: self.searchVal.project,
                        hours: Number(self.searchVal.hours)
                    });
                    break;

                }
                // var data = JSON.stringify({
                //     token: util.getParams("token"),
                //     action: 'getTermLoginInfo',
                //     endDate: $scope.searchDate + ' 00:00:00',
                //     project: self.searchVal.project,
                //     days: Number(self.duration)
                // })
                self.loadingChart = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories[0].category = [];
                        $scope.dataset = [];
                        self.dataSet = [];

                        switch (self.searchVal.queryType) {
                            case '0': data.dateList.forEach(function(item, index, array) {
                                $scope.categories[0].category.push({label: item.substring(5, 10)});
                                self.dataSet.push({'datetime': item.substring(5, 10)});
                            });
                                break;
                            case '1': data.hourList.forEach(function(item, index, array) {
                                $scope.categories[0].category.push({label: item.substring(5, 16)});
                                self.dataSet.push({'datetime': item.substring(5, 16)});
                            });
                                break;

                        }
                        // data.dateList.forEach(function(item, index, array) {
                        //     $scope.categories[0].category.push({label: item.substring(5, 10)});
                        // });
                        $scope.dataset.push({seriesname: "总数", data:[]});
                        data.totalCount.forEach(function(item, index, array) {
                            $scope.dataset[0].data.push({ value: item });
                            self.dataSet[index].totalCount = item;
                        });

                        $scope.dataset.push({seriesname: "上线", data:[]});
                        data.loginCount.forEach(function(item, index, array) {
                            $scope.dataset[1].data.push({ value: item });
                            self.dataSet[index].loginCount = item;
                        });

                   } else if (data.rescode == '401') {
                       alert('访问超时，请重新登录');
                       $location.path("pages/login.html");
                   } else {
                       alert(data.errInfo);
                   }

                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.loadingChart = false;
                });
            }

            /**
             * 查询类型选择
             */
            self.selectType = function () {
                if (self.searchVal.queryType == "1") {
                    self.slTime = true;

                } else {
                    self.slTime = false;
                }
                switch (self.searchVal.queryType) {
                    case '0': self.xAxisName = "日期"; break;
                    case '1': self.xAxisName = "时"; break;
                }
                self.initAttrs();
                self.search();
            }

            /**
             * 列表排序
             * @param orderby
             */
            self.changeOrderby = function (orderby) {
                self.orderby.sort = orderby;
                self.orderby.desc = !self.orderby.desc;
            }
        }
    ]) 

    .controller('moviePayController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, $q, util, CONFIG) {
            
            var self = this;
            self.searchVal = {}; // 筛选内容

            // 日期选择初始化
            moment.locale('zh-cn');
            $scope.startDateBeforeRender = startDateBeforeRender;
            $scope.startDateOnSetTime = startDateOnSetTime;
            $scope.endDateOnSetTime = endDateOnSetTime;

            function startDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownStart')).click();  
              $scope.$broadcast('start-date-changed');
              self.search();
            }

            function endDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownEnd')).click();  
              $scope.$broadcast('end-date-changed');
              self.search();
            }

            function startDateBeforeRender ($dates) {
              if ($scope.dateRangeStart) {
                var activeDate = moment($scope.dateRangeStart);

                $dates.filter(function (date) {
                  return date.localDateValue() >= activeDate.valueOf()
                }).forEach(function (date) {
                  date.selectable = false;
                })
              }
            }


            self.init = function() {
              self.searchVal = {};
              self.loadProList().then(function() {
                return self.search();
              });
              self.initCharts();
              $scope.dateRangeStart = $filter('date')((new Date().getTime()) + 1*24*60*60*1000, 'yyyy-MM-dd');
              $scope.searchStartDate = $filter('date')((new Date().getTime() - 6*24*60*60*1000), 'yyyy-MM-dd');
              $scope.searchEndDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
            }

            self.initCharts = function () {
                // init chart1
                self.attrs1 = {
                    "caption": "各项目付费金额统计",
                    "xAxisname": "项目",
                    "yAxisName": "金额 (元)",
                    "numberPrefix": "¥ ",
                    "plotFillAlpha" : "",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#ffffff",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "1",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories1 = [
                    {
                        "category": [
                        ]
                    }
                ];
                self.dataset1 = [];
                self.orderby = [
                    {sort: 'sumPPrice', desc: true},
                    {sort: 'sumPCount', desc: true},
                    {sort: '', desc: true},
                    {sort: '', desc: true}
                ];


                // init chart2
                $scope.attrs2 = {
                    "caption": "各项目付费次数统计",
                    "xAxisname": "项目",
                    "yAxisName": "次数",
                    "numberPrefix": "",
                    "plotFillAlpha" : "",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#ffffff",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "1",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                $scope.categories2 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset2 = [];

                // init chart3
                $scope.attrs3 = {
                    "caption": "每日支付金额统计",
                    "numberprefix": "¥ ",
                    "yAxisname": "金额（元）",
                    "xAxisName": "日期",
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
                $scope.categories3 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset3 = [];

                // init chart4
                $scope.attrs4 = {
                    "caption": "每日支付次数统计",
                    "numberprefix": "",
                    "yAxisname": "次数（次）",
                    "xAxisName": "日期",
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
                $scope.categories4 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset4 = [];
            }

            self.search = function () {
                self.loadChart3().then(function() {
                    return self.loadChart4();
                }).then(function() {
                    return self.loadChart1();
                }).then(function() {
                    return self.loadChart2();
                })
            }

            self.loadProList = function () {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'projectNameList'
                })
                self.loadingProList = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('project', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.searchVal.projects = [];
                        self.searchVal.projects[0] = {value: 'all', name: '全部项目'};
                        data.data.forEach(function(item, index, array) {
                            self.searchVal.projects.push({ value:item.ProjectName , name: item.ProjectNameCHZ });
                            self.searchVal.project = 'all';
                        })
                        deferred.resolve();
                    }
                    else if (data.rescode == '401') {
                        alert('登录超时，请重现登录。')
                        $location.path("pages/login.html");
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingProList = false;
                });
                return deferred.promise;
            }

            self.loadChart1 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getProjectPurchasePrice',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart1 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {

                        self.categories1[0].category = [];
                        self.dataset1 = [];
                        self.dataSet1 = [];
                        self.dataset1.total = 0;

                        data.projectListCHZ.forEach(function(item, index, array) {
                            if (index < 5) self.categories1[0].category.push({label: item});
                            self.dataSet1.push({'projectListCHZ': item});
                        });

                        self.dataset1.push({seriesname: "打包支付金额", data:[]});
                        data.packagePPrice.forEach(function(item, index, array) {
                            if (index < 5) self.dataset1[0].data.push({ value: item/100 });
                            self.dataSet1[index].packagePPrice = item/100;
                        });

                        self.dataset1.push({seriesname: "单次支付金额", data:[]});
                        data.onlyPPrice.forEach(function(item, index, array) {
                            if (index < 5) self.dataset1[1].data.push({ value: item/100 });
                            self.dataSet1[index].onlyPPrice = item/100;
                        });

                        self.dataset1.push({seriesname: "总金额", data:[]});
                        data.sumPPrice.forEach(function(item, index, array) {
                            // self.dataset1.total += Number(item);
                            if (index < 5) self.dataset1[2].data.push({ value: item/100 });
                            self.dataSet1[index].sumPPrice = item/100;
                        });
                        self.dataset1.total = data.allProjectSumPrice/100;

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart1 = false;
                });
                return deferred.promise;
            }

            self.loadChart2 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getProjectPurchaseCount',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart2 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories2[0].category = [];
                        $scope.dataset2 = [];
                        self.dataSet2 = [];
                        $scope.dataset2.total = 0;

                        data.projectListCHZ.forEach(function(item, index, array) {
                            if (index < 5) $scope.categories2[0].category.push({label: item});
                            self.dataSet2.push({'projectListCHZ': item});
                        });

                        $scope.dataset2.push({seriesname: "打包支付次数", data:[]});
                        data.packagePCount.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[0].data.push({ value: item });
                            self.dataSet2[index].packagePCount = Number(item);
                        });

                        $scope.dataset2.push({seriesname: "单次支付次数", data:[]});
                        data.onlyPCount.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[1].data.push({ value: item });
                            self.dataSet2[index].onlyPCount = Number(item);
                        });

                        $scope.dataset2.push({seriesname: "总次数", data:[]});
                        data.sumPCount.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[2].data.push({ value: item });
                            // $scope.dataset2.total += Number(item);
                            self.dataSet2[index].sumPCount = Number(item);
                        });
                        $scope.dataset2.total = data.allProjectSumCount;
                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart2 = false;
                });
                return deferred.promise;
            }

            self.loadChart3 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getDatePurchasePrice',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart3 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories3[0].category = [];
                        $scope.dataset3 = [];
                        self.dataSet3 = [];

                        data.dateList.forEach(function(item, index, array) {
                            $scope.categories3[0].category.push({label: item.substring(5, 10)});
                            self.dataSet3.push({'date': item.substring(5, 10)});
                        });

                        $scope.dataset3.push({seriesname: "总金额", data:[]});
                        data.sumPPrice.forEach(function(item, index, array) {
                            $scope.dataset3[0].data.push({ value: item/100 });
                            self.dataSet3[index].sumPPrice = item/100;
                        });

                        $scope.dataset3.push({seriesname: "单次支付金额", data:[]});
                        data.onlyPPrice.forEach(function(item, index, array) {
                            $scope.dataset3[1].data.push({ value: item/100 });
                            self.dataSet3[index].onlyPPrice = item/100;
                        });

                        $scope.dataset3.push({seriesname: "打包支付金额", data:[]});
                        data.packagePPrice.forEach(function(item, index, array) {
                            $scope.dataset3[2].data.push({ value: item/100 });
                            self.dataSet3[index].packagePPrice = item/100;
                        });
                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart3 = false;
                });
                return deferred.promise;
            }

            self.loadChart4 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getDatePurchaseCount',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart4 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories4[0].category = [];
                        $scope.dataset4 = [];
                        self.dataSet4 = [];

                        data.dateList.forEach(function(item, index, array) {
                            $scope.categories4[0].category.push({label: item.substring(5, 10)});
                            self.dataSet4.push({'date': item.substring(5, 10)});
                        });

                        $scope.dataset4.push({seriesname: "总次数", data:[]});
                        data.sumPCount.forEach(function(item, index, array) {
                            $scope.dataset4[0].data.push({ value: item });
                            self.dataSet4[index].sumPCount = item;
                        });

                        $scope.dataset4.push({seriesname: "单次支付次数", data:[]});
                        data.onlyPCount.forEach(function(item, index, array) {
                            $scope.dataset4[1].data.push({ value: item });
                            self.dataSet4[index].onlyPCount = item;
                        });

                        $scope.dataset4.push({seriesname: "打包支付次数", data:[]});
                        data.packagePCount.forEach(function(item, index, array) {
                            $scope.dataset4[2].data.push({ value: item });
                            self.dataSet4[index].packagePCount = item;
                        });
                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart4 = false;
                });
                return deferred.promise;
            }

            /**
             * 列表排序
             * @param index
             * @param orderby
             */
            self.changeOrderby = function (index, orderby) {
                self.orderby[index].sort = orderby;
                self.orderby[index].desc = !self.orderby[index].desc;
            }
        }
    ]) 

    .controller('roomPayController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.searchVal = {}; // 筛选内容

            // 日期选择初始化
            moment.locale('zh-cn');
            $scope.startDateBeforeRender = startDateBeforeRender;
            $scope.startDateOnSetTime = startDateOnSetTime;
            $scope.endDateOnSetTime = endDateOnSetTime;

            function startDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownStart')).click();  
              $scope.$broadcast('start-date-changed');
              self.search();
            }

            function endDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownEnd')).click();  
              $scope.$broadcast('end-date-changed');
              self.search();
            }

            function startDateBeforeRender ($dates) {
              if ($scope.dateRangeStart) {
                var activeDate = moment($scope.dateRangeStart);

                $dates.filter(function (date) {
                  return date.localDateValue() >= activeDate.valueOf()
                }).forEach(function (date) {
                  date.selectable = false;
                })
              }
            }


            self.init = function() {
              self.searchVal = {};
              self.loadProList().then(function() {
                return self.search();
              });
              self.initCharts();
              $scope.dateRangeStart = $filter('date')((new Date().getTime()) + 1*24*60*60*1000, 'yyyy-MM-dd');
              $scope.searchStartDate = $filter('date')((new Date().getTime() - 6*24*60*60*1000), 'yyyy-MM-dd');
              $scope.searchEndDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
            }

            self.initCharts = function () {
                // init chart1
                self.attrs1 = {
                    "caption": "各项目订单金额统计",
                    "xAxisname": "项目",
                    "yAxisName": "金额 (元)",
                    "numberPrefix": "¥ ",
                    "plotFillAlpha" : "",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#ffffff",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "1",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories1 = [
                    {
                        "category": [
                        ]
                    }
                ];
                self.dataset1 = [];
                self.orderby = [
                    {sort: 'COMPLETED', desc: true},
                    {sort: 'COMPLETED', desc: true},
                    {sort: 'sumPPrice', desc: true},
                    {sort: 'ALL', desc: true}
                ];


                // init chart2
                $scope.attrs2 = {
                    "caption": "各项目订单数量统计",
                    "xAxisname": "项目",
                    "yAxisName": "次数",
                    "numberPrefix": "",
                    "plotFillAlpha" : "",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#ffffff",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "1",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                $scope.categories2 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset2 = [];

                // init chart3
                $scope.attrs3 = {
                    "caption": "每日订单金额统计",
                    "numberprefix": "¥ ",
                    "yAxisname": "金额（元）",
                    "xAxisName": "日期",
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
                $scope.categories3 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset3 = [];

                // init chart4
                $scope.attrs4 = {
                    "caption": "每日订单量统计",
                    "numberprefix": "",
                    "yAxisname": "次数（次）",
                    "xAxisName": "日期",
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
                $scope.categories4 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset4 = [];
            }

            self.search = function () {
                self.loadChart3().then(function() {
                    return self.loadChart4();
                }).then(function() {
                    return self.loadChart1();
                }).then(function() {
                    return self.loadChart2();
                })
            }

            self.loadProList = function () {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'projectNameList'
                })
                self.loadingProList = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('project', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.searchVal.projects = [];
                        self.searchVal.projects[0] = {value: 'all', name: '全部项目'};
                        data.data.forEach(function(item, index, array) {
                            self.searchVal.projects.push({ value:item.ProjectName , name: item.ProjectNameCHZ });
                            self.searchVal.project = 'all';
                        })
                        deferred.resolve();
                    } 
                    else if (data.rescode == '401') {
                        alert('登录超时，请重现登录。')
                        $location.path("pages/login.html");
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingProList = false;
                });
                return deferred.promise;
            }

            self.loadChart1 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getProjectPurchasePrice',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart1 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('room/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {

                        self.categories1[0].category = [];
                        self.dataset1 = [];
                        self.dataSet1 = [];
                        self.dataset1.total = 0;

                        data.projectListCHZ.forEach(function(item, index, array) {
                            if (index < 5) self.categories1[0].category.push({label: item});
                            self.dataSet1.push({'projectList': item});
                        });

                        self.dataset1.push({seriesname: "已完成订单金额", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            if (index < 5) self.dataset1[0].data.push({ value: item/100 });
                            self.dataSet1[index].COMPLETED = item/100;
                        });

                        data.COMPLETED.forEach(function(item, index, array) {
                            self.dataset1.total += Number(item)
                        })
                        self.dataset1.total /= 100

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart1 = false;
                });
                return deferred.promise;
            }

            self.loadChart2 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getProjectPurchaseCount',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart2 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('room/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories2[0].category = [];
                        $scope.dataset2 = [];
                        self.dataSet2 = [];
                        self.dataSet2.total1 = 0
                        self.dataSet2.total2 = 0
                        data.projectListCHZ.forEach(function(item, index, array) {
                            if (index < 5) $scope.categories2[0].category.push({label: item});
                            self.dataSet2.push({'projectList': item});
                        });
                        $scope.dataset2.push({seriesname: "订单总量", data:[]});
                        data.ALL.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[0].data.push({ value: item });
                            // $scope.dataset2.total += Number(item);
                            self.dataSet2[index].ALL = Number(item);
                        });
                        $scope.dataset2.push({seriesname: "已完成订单量", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[1].data.push({ value: item });
                            self.dataSet2[index].COMPLETED = Number(item);
                        });

                        data.ALL.forEach(function(item, index, array) {
                            self.dataSet2.total1 += Number(item);
                        });

                        data.COMPLETED.forEach(function(item, index, array) {
                            self.dataSet2.total2 += Number(item);
                        });

                        deferred.resolve();
                    }
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart2 = false;
                });
                return deferred.promise;
            }

            self.loadChart3 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getDatePurchasePrice',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart3 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('room/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories3[0].category = [];
                        $scope.dataset3 = [];
                        self.dataSet3 = [];

                        data.dateList.forEach(function(item, index, array) {
                            $scope.categories3[0].category.push({label: item.substring(5, 10)});
                            self.dataSet3.push({'date': item.substring(5, 10)});
                        });

                        $scope.dataset3.push({seriesname: "已完成订单", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            $scope.dataset3[0].data.push({ value: item/100 });
                            self.dataSet3[index].sumPPrice = item/100;
                        });

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart3 = false;
                });
                return deferred.promise;
            }

            self.loadChart4 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getDatePurchaseCount',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart4 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('room/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories4[0].category = [];
                        $scope.dataset4 = [];
                        self.dataSet4 = [];

                        data.dateList.forEach(function(item, index, array) {
                            $scope.categories4[0].category.push({label: item.substring(5, 10)});
                            self.dataSet4.push({'date': item.substring(5, 10)});
                        });

                        $scope.dataset4.push({seriesname: "总订单量", data:[]});
                        data.ALL.forEach(function(item, index, array) {
                            $scope.dataset4[0].data.push({ value: item });
                            self.dataSet4[index].ALL = item;
                        });

                        $scope.dataset4.push({seriesname: "已完成订单量", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            $scope.dataset4[1].data.push({ value: item });
                            self.dataSet4[index].COMPLETED = item;
                        });

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart4 = false;
                });
                return deferred.promise;
            }

            /**
             * 列表排序
             * @param index
             * @param orderby
             */
            self.changeOrderby = function (index, orderby) {
                self.orderby[index].sort = orderby;
                self.orderby[index].desc = !self.orderby[index].desc;
            }
        }
    ]) 

    .controller('shopPayController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', '$q', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, $q, util, CONFIG) {
            var self = this;
            self.searchVal = {}; // 筛选内容

            // 日期选择初始化
            moment.locale('zh-cn');
            $scope.startDateBeforeRender = startDateBeforeRender;
            $scope.startDateOnSetTime = startDateOnSetTime;
            $scope.endDateOnSetTime = endDateOnSetTime;

            function startDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownStart')).click();  
              $scope.$broadcast('start-date-changed');
              self.search();
            }

            function endDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownEnd')).click();  
              $scope.$broadcast('end-date-changed');
              self.search();
            }

            function startDateBeforeRender ($dates) {
              if ($scope.dateRangeStart) {
                var activeDate = moment($scope.dateRangeStart);

                $dates.filter(function (date) {
                  return date.localDateValue() >= activeDate.valueOf()
                }).forEach(function (date) {
                  date.selectable = false;
                })
              }
            }


            self.init = function() {
              self.searchVal = {};
              self.loadProList().then(function() {
                return self.search();
              });
              self.initCharts();
              $scope.dateRangeStart = $filter('date')((new Date().getTime()) + 1*24*60*60*1000, 'yyyy-MM-dd');
              $scope.searchStartDate = $filter('date')((new Date().getTime() - 6*24*60*60*1000), 'yyyy-MM-dd');
              $scope.searchEndDate = $filter('date')((new Date().getTime()), 'yyyy-MM-dd');
            }

            self.initCharts = function () {
                // init chart1
                self.attrs1 = {
                    "caption": "各项目订单金额统计",
                    "xAxisname": "项目",
                    "yAxisName": "金额 (元)",
                    "numberPrefix": "¥ ",
                    "plotFillAlpha" : "",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#ffffff",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "1",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                self.categories1 = [
                    {
                        "category": [
                        ]
                    }
                ];
                self.dataset1 = [];
                self.orderby = [
                    {sort: 'COMPLETED', desc: true},
                    {sort: 'COMPLETED', desc: true},
                    {sort: 'sumPPrice', desc: true},
                    {sort: 'ALL', desc: true}
                ];


                // init chart2
                $scope.attrs2 = {
                    "caption": "各项目订单数量统计",
                    "xAxisname": "项目",
                    "yAxisName": "次数",
                    "numberPrefix": "",
                    "plotFillAlpha" : "",

                    //Cosmetics
                    "paletteColors" : "#0075c2,#1aaf5d",
                    "baseFontColor" : "#333333",
                    "baseFont" : "Helvetica Neue,Arial",
                    "captionFontSize" : "14",
                    "subcaptionFontSize" : "14",
                    "subcaptionFontBold" : "0",
                    "showBorder" : "0",
                    "bgColor" : "#ffffff",
                    "showShadow" : "0",
                    "canvasBgColor" : "#ffffff",
                    "canvasBorderAlpha" : "0",
                    "divlineAlpha" : "100",
                    "divlineColor" : "#999999",
                    "divlineThickness" : "1",
                    "divLineIsDashed" : "1",
                    "divLineDashLen" : "1",
                    "divLineGapLen" : "1",
                    "usePlotGradientColor" : "0",
                    "showplotborder" : "0",
                    "valueFontColor" : "#ffffff",
                    "placeValuesInside" : "1",
                    "showHoverEffect" : "1",
                    "rotateValues" : "1",
                    "showXAxisLine" : "1",
                    "xAxisLineThickness" : "1",
                    "xAxisLineColor" : "#999999",
                    "showAlternateHGridColor" : "0",
                    "legendBgAlpha" : "0",
                    "legendBorderAlpha" : "0",
                    "legendShadow" : "0",
                    "legendItemFontSize" : "10",
                    "legendItemFontColor" : "#666666"
                };
                $scope.categories2 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset2 = [];

                // init chart3
                $scope.attrs3 = {
                    "caption": "每日订单金额统计",
                    "numberprefix": "¥ ",
                    "yAxisname": "金额（元）",
                    "xAxisName": "日期",
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
                $scope.categories3 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset3 = [];

                // init chart4
                $scope.attrs4 = {
                    "caption": "每日订单量统计",
                    "numberprefix": "",
                    "yAxisname": "次数（次）",
                    "xAxisName": "日期",
                    "plotgradientcolor": "",
                    "bgcolor": "FFFFFF",
                    "showalternatehgridcolor": "0",
                    "divlinecolor": "CCCCCC",
                    "showvalues": "0",
                    "showcanvasborder": "0",
                    "canvasborderalpha": "0",
                    "canvasbordercolor": "CCCCCC",
                    "canvasborderthickness": "1",
                    "yaxismaxvalue": "",
                    "captionpadding": "30",
                    "linethickness": "3",
                    "yaxisvaluespadding": "15",
                    "legendshadow": "0",
                    "legendborderalpha": "0",
                    "palettecolors": "#f8bd19,#008ee4,#33bdda,#e44a00,#6baa01,#583e78",
                    "showborder": "0"
                };
                $scope.categories4 = [
                    {
                        "category": []
                    }
                ];
                $scope.dataset4 = [];
            }

            self.search = function () {
                self.loadChart3().then(function() {
                    return self.loadChart4();
                }).then(function() {
                    return self.loadChart1();
                }).then(function() {
                    return self.loadChart2();
                })
            }

            self.loadProList = function () {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'projectNameList'
                })
                self.loadingProList = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('project', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.searchVal.projects = [];
                        self.searchVal.projects[0] = {value: 'all', name: '全部项目'};
                        data.data.forEach(function(item, index, array) {
                            self.searchVal.projects.push({ value:item.ProjectName , name: item.ProjectNameCHZ });
                            self.searchVal.project = 'all';
                        })
                        deferred.resolve();
                    } 
                    else if (data.rescode == '401') {
                        alert('登录超时，请重现登录。')
                        $location.path("pages/login.html");
                    }
                    else {
                        alert(data.rescode + ' ' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingProList = false;
                });
                return deferred.promise;
            }

            self.loadChart1 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getProjectPurchasePrice',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart1 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('shop/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {

                        self.categories1[0].category = [];
                        self.dataset1 = [];
                        self.dataSet1 = [];
                        self.dataset1.total = 0;

                        data.projectListCHZ.forEach(function(item, index, array) {
                            if (index < 5) self.categories1[0].category.push({label: item});
                            self.dataSet1.push({'projectList': item});
                        });

                        self.dataset1.push({seriesname: "已完成订单金额", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            if (index < 5) self.dataset1[0].data.push({ value: item/100 });
                            self.dataSet1[index].COMPLETED = item/100;
                        });

                        data.COMPLETED.forEach(function(item, index, array) {
                            self.dataset1.total += Number(item)
                        })
                        self.dataset1.total /= 100

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart1 = false;
                });
                return deferred.promise;
            }

            self.loadChart2 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getProjectPurchaseCount',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart2 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('shop/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories2[0].category = [];
                        $scope.dataset2 = [];
                        self.dataSet2 = [];
                        self.dataSet2.total1 = 0
                        self.dataSet2.total2 = 0
                        data.projectListCHZ.forEach(function(item, index, array) {
                            if (index < 5) $scope.categories2[0].category.push({label: item});
                            self.dataSet2.push({'projectList': item});
                        });
                        $scope.dataset2.push({seriesname: "订单总量", data:[]});
                        data.ALL.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[0].data.push({ value: item });
                            // $scope.dataset2.total += Number(item);
                            self.dataSet2[index].ALL = Number(item);
                        });
                        $scope.dataset2.push({seriesname: "已完成订单量", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            if (index < 5) $scope.dataset2[1].data.push({ value: item });
                            self.dataSet2[index].COMPLETED = Number(item);
                        });

                        data.ALL.forEach(function(item, index, array) {
                            self.dataSet2.total1 += Number(item);
                        });

                        data.COMPLETED.forEach(function(item, index, array) {
                            self.dataSet2.total2 += Number(item);
                        });

                        deferred.resolve();
                    }
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart2 = false;
                });
                return deferred.promise;
            }

            self.loadChart3 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getDatePurchasePrice',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart3 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('shop/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories3[0].category = [];
                        $scope.dataset3 = [];
                        self.dataSet3 = [];

                        data.dateList.forEach(function(item, index, array) {
                            $scope.categories3[0].category.push({label: item.substring(5, 10)});
                            self.dataSet3.push({'date': item.substring(5, 10)});
                        });

                        $scope.dataset3.push({seriesname: "已完成订单", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            $scope.dataset3[0].data.push({ value: item/100 });
                            self.dataSet3[index].sumPPrice = item/100;
                        });

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart3 = false;
                });
                return deferred.promise;
            }

            self.loadChart4 = function () {
                var deferred = $q.defer();

                var data = JSON.stringify({
                    token: util.getParams("token"),
                    action: 'getDatePurchaseCount',
                    startDate: $scope.searchStartDate + ' 00:00:00',
                    endDate: $scope.searchEndDate + ' 00:00:00',
                    projectList: [self.searchVal.project]
                })
                self.loadingChart4 = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('shop/statistics', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        $scope.categories4[0].category = [];
                        $scope.dataset4 = [];
                        self.dataSet4 = [];

                        data.dateList.forEach(function(item, index, array) {
                            $scope.categories4[0].category.push({label: item.substring(5, 10)});
                            self.dataSet4.push({'date': item.substring(5, 10)});
                        });

                        $scope.dataset4.push({seriesname: "总订单量", data:[]});
                        data.ALL.forEach(function(item, index, array) {
                            $scope.dataset4[0].data.push({ value: item });
                            self.dataSet4[index].ALL = item;
                        });

                        $scope.dataset4.push({seriesname: "已完成订单量", data:[]});
                        data.COMPLETED.forEach(function(item, index, array) {
                            $scope.dataset4[1].data.push({ value: item });
                            self.dataSet4[index].COMPLETED = item;
                        });

                        deferred.resolve();
                    } 
                    else {
                        alert(data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingChart4 = false;
                });
                return deferred.promise;
            }

            /**
             * 列表排序
             * @param index
             * @param orderby
             */
            self.changeOrderby = function (index, orderby) {
                self.orderby[index].sort = orderby;
                self.orderby[index].desc = !self.orderby[index].desc;
            }
        }
    ]) 
})();
