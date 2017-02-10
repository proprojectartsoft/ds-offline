angular.module($APP.name).factory('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer) {
        return {
            downloadPdf: function(base64String) {
                return $http.get($APP.server + '/pub/drawings/' + base64String, {
                        responseType: 'blob'
                    })
                    .success(function(data, status, headers) {
                        $ionicPlatform.ready(function() {
                            if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                                if (typeof cordova == 'undefined') {
                                    cordova = {};
                                    cordova.file = {
                                        dataDirectory: '///'
                                    }
                                }
                                console.log("cordova base dir: " + cordova.file.dataDirectory);
                                //check space $cordovaFile.getFreeDiskSpace().then(function(success) { // success in kilobytes }, function ( error ) { // error });
                                // CREATE
                                //TODO: keep in indexdb
                                $cordovaFile.createDir(cordova.file.dataDirectory, 'ds-downloads', true)
                                    .then(function(success) {
                                        // success
                                        console.log('dir created');
                                        console.log(success);
                                        // Download
                                        document.addEventListener(
                                            "deviceready",
                                            function() {
                                                var fileTransfer = new FileTransfer();
                                                var uri = encodeURI("$APP.server + '/pub/drawings/' + base64String"); // encodeURI("http://ionicframework.com/img/ionic-logo-blog.png");

                                                fileTransfer.download(
                                                    uri,
                                                    fileURL,
                                                    function(entry) {
                                                        console.log("download complete: " + entry.toURL());
                                                        $scope.Path = fileURL;
                                                    },
                                                    function(error) {
                                                        console.log("download error source " + error.source);
                                                        console.log("download error target " + error.target);
                                                        console.log("upload error code" + error.code);
                                                    }
                                                );
                                            },
                                            false);
                                    }, function(error) {
                                        // error
                                        console.log(error);
                                    });
                            }
                        })
                    }).error(function(response) {
                        console.log(response);
                    });
            }
        };
    }
]);
