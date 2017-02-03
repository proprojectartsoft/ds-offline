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

                                if (cordova === undefined) {
                                    cordova.file = {
                                        dataDirectory: '///'
                                    }
                                }
                                // CREATE
                                $cordovaFile.createDir(cordova.file.dataDirectory, base64String, true)
                                    .then(function(success) {
                                        // success
                                        console.log('dir created');
                                        console.log(success);
                                    }, function(error) {
                                        // error
                                        console.log(error);
                                    });

                                // Download
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
                            }
                        })
                    }).error(function(response) {
                        console.log(response);
                    });
            }
        };
    }
]);
