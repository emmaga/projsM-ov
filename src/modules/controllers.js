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
    
    .controller('onlineController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, NgTableParams, util, CONFIG) {
            var self = this;

            moment.locale('zh-cn');
            $scope.startDateBeforeRender = startDateBeforeRender;
            $scope.startDateOnSetTime = startDateOnSetTime;
            $scope.dateRangeStart = '2017-02-23';
            $scope.searchDate = '2017-02-13';

            function startDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('.dropdown-toggle')).click();  
              $scope.$broadcast('start-date-changed');
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
              self.loadChart1();   
            }

            self.loadChart1 = function () {
                $scope.attrs = {
                    "caption": "上线情况统计",
                    "numberprefix": "",
                    "yAxisname": "终端数（个）",
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
                            
                $scope.categories = [
                    {
                        "category": [
                            {
                                "label": "4.1"
                            },
                            {
                                "label": "4.2"
                            },
                            {
                                "label": "4.3"
                            },
                            {
                                "label": "4.4"
                            },
                            {
                                "label": "4.5"
                            },
                            {
                                "label": "4.6"
                            },
                            {
                                "label": "4.7"
                            },
                            {
                                "label": "4.8"
                            },
                            {
                                "label": "4.9"
                            },
                            {
                                "label": "4.10"
                            },
                            {
                                "label": "4.11"
                            },
                            {
                                "label": "4.12"
                            },
                            {
                                "label": "4.13"
                            },
                            {
                                "label": "4.14"
                            },
                            {
                                "label": "4.15"
                            },
                            {
                                "label": "4.16"
                            },
                            {
                                "label": "4.17"
                            },
                            {
                                "label": "4.18"
                            },
                            {
                                "label": "4.19"
                            },
                            {
                                "label": "4.20"
                            },
                            {
                                "label": "4.21"
                            },
                            {
                                "label": "4.22"
                            },
                            {
                                "label": "4.23"
                            },
                            {
                                "label": "4.24"
                            },
                            {
                                "label": "4.25"
                            },
                            {
                                "label": "4.26"
                            },
                            {
                                "label": "4.27"
                            },
                            {
                                "label": "4.28"
                            },
                            {
                                "label": "4.29"
                            },
                            {
                                "label": "4.30"
                            }
                        ]
                    }
                ];

                $scope.dataset = [
                    {
                        "seriesname": "总数",
                        "data": [
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "402"
                            },
                            {
                                "value": "403"
                            },
                            {
                                "value": "403"
                            },
                            {
                                "value": "402"
                            }
                        ]
                    },
                    {
                        "seriesname": "上线",
                        "data": [
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "12"
                            },
                            {
                                "value": "13"
                            },
                            {
                                "value": "23"
                            },
                            {
                                "value": "12"
                            }
                        ]
                    }
                ];
            }
        }
    ]) 

    .controller('moviePayController', ['$http', '$scope', '$state', '$location','$filter', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state,$location, $filter, $stateParams, NgTableParams, util, CONFIG) {
            var self = this;

            // 日期选择初始化
            moment.locale('zh-cn');
            $scope.startDateBeforeRender = startDateBeforeRender;
            $scope.startDateOnSetTime = startDateOnSetTime;
            $scope.endDateOnSetTime = endDateOnSetTime;
            $scope.dateRangeStart = '2017-02-23';
            $scope.searchStartDate = '2017-02-13';
            $scope.searchEndDate = '2017-02-15';

            function startDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownStart')).click();  
              $scope.$broadcast('start-date-changed');
            }

            function endDateOnSetTime () {
              // https://github.com/dalelotts/angular-bootstrap-datetimepicker/issues/111
              // 在controller里操作dom会影响性能，但这样能解决问题
              angular.element(document.querySelector('#dropdownEnd')).click();  
              $scope.$broadcast('end-date-changed');
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
              self.loadChart1();
              self.loadChart2();
              self.loadChart3();
              self.loadChart4();
            }

            self.loadChart1 = function () {
                $scope.attrs1 = {
                    "caption": "各项目付费金额统计",
                    "xAxisname": "项目",
                    "yAxisName": "金额 (元)",
                    "numberPrefix": "RMB ",
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
                            
                $scope.categories1 = [
                    {
                        "category": [
                            { "label": "书香世家" },
                            { "label": "皇廷花园" },
                            { "label": "皇廷世纪" }
                        ]
                    }
                ];

                $scope.dataset1 = [
                    {
                        "seriesname": "单次支付金额",
                        "data": [
                            { "value": "100" }, 
                            { "value": "115" }, 
                            { "value": "125" }
                        ]
                    }, 
                    {
                        "seriesname": "打包支付金额",
                        "data": [
                            { "value": "250" }, 
                            { "value": "200" }, 
                            { "value": "210" }
                        ]
                    }, 
                    {
                        "seriesname": "总数",
                        "data": [
                            { "value": "350" }, 
                            { "value": "310" }, 
                            { "value": "335" }
                        ]
                    }
                ];
            }

            self.loadChart2 = function () {
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
                        "category": [
                            { "label": "书香世家" },
                            { "label": "皇廷花园" },
                            { "label": "皇廷世纪" }
                        ]
                    }
                ];

                $scope.dataset2 = [
                    {
                        "seriesname": "单次支付次数",
                        "data": [
                            { "value": "10" }, 
                            { "value": "115" }, 
                            { "value": "125" }
                        ]
                    }, 
                    {
                        "seriesname": "打包支付次数",
                        "data": [
                            { "value": "250" }, 
                            { "value": "200" }, 
                            { "value": "210" }
                        ]
                    }, 
                    {
                        "seriesname": "总次数",
                        "data": [
                            { "value": "350" }, 
                            { "value": "310" }, 
                            { "value": "335" }
                        ]
                    }
                ];
            }

            self.loadChart3 = function () {
                $scope.attrs3 = {
                    "caption": "每日支付金额统计",
                    "numberprefix": "RMB ",
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
                        "category": [
                            {
                                "label": "4.1"
                            },
                            {
                                "label": "4.2"
                            },
                            {
                                "label": "4.3"
                            },
                            {
                                "label": "4.4"
                            },
                            {
                                "label": "4.5"
                            },
                            {
                                "label": "4.6"
                            },
                            {
                                "label": "4.7"
                            }
                        ]
                    }
                ];

                $scope.dataset3 = [
                    {
                        "seriesname": "总金额",
                        "data": [
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            }
                        ]
                    },
                    {
                        "seriesname": "单次支付金额",
                        "data": [
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            }
                        ]
                    },
                    {
                        "seriesname": "打包支付金额",
                        "data": [
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            }
                        ]
                    }
                ];
            }

            self.loadChart4 = function () {
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
                        "category": [
                            {
                                "label": "4.1"
                            },
                            {
                                "label": "4.2"
                            },
                            {
                                "label": "4.3"
                            },
                            {
                                "label": "4.4"
                            },
                            {
                                "label": "4.5"
                            },
                            {
                                "label": "4.6"
                            },
                            {
                                "label": "4.7"
                            }
                        ]
                    }
                ];

                $scope.dataset4 = [
                    {
                        "seriesname": "总次数",
                        "data": [
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            },
                            {
                                "value": "400"
                            }
                        ]
                    },
                    {
                        "seriesname": "单次支付次数",
                        "data": [
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            },
                            {
                                "value": "80"
                            }
                        ]
                    },
                    {
                        "seriesname": "打包支付次数",
                        "data": [
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            },
                            {
                                "value": "180"
                            }
                        ]
                    }
                ];
            }
        }
    ]) 
})();
