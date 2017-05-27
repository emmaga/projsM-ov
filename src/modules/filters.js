'use strict';

(function () {
    var app = angular.module('app.filters', [])

        .filter("ajaxMethod", ['CONFIG', function (CONFIG) {
            return function () {
                var method = CONFIG.test ? 'GET' : 'POST';
                return method;
            };
        }])

        .filter("fenToYuan", function () {
            return function (fen) {
                var s = fen + '';
                if (s.length == 1) {
                    s = '00' + s;
                }
                else if (s.length == 2) {
                    s = '0' + s;
                }
                var s1 = s.slice(0, -2);
                var s2 = s.slice(-2);
                return s1 + '.' + s2;
            };
        })

        .filter("toPercent", function () {
            return function (num) {
                var s = num + '';
                if (s.length == 1) {
                    s = '00' + s;
                }
                else if (s.length == 2) {
                    s = '0' + s;
                }
                var s1 = s.slice(0, -2);
                var s2 = s.slice(-2);
                return s1 + '.' + s2 + '%';
            };
        })

        /**
         * 保留两位小数
         */
        .filter("leftTwoDecimal", function () {
            return function (num) {
                return num.toFixed(2);
            };
        })

        /**
         * 字符串超长截取
         */
        .filter("substring", function () {
            return function (string, length) {
                if (string.length > length) {
                    var str = string.substr(0, length) + '...';
                }
                return str;
            };
        })

        .filter("subtitlePercentComplete", function () {
            return function (subtitlePercentComplete) {
                if (subtitlePercentComplete) {
                    if (subtitlePercentComplete == '失败') {
                        return subtitlePercentComplete;
                    }
                    else {
                        return subtitlePercentComplete + '%';
                    }
                }
                else {
                    return '无'
                }
            }
        })

})();