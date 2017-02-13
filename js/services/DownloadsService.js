angular.module($APP.name).factory('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer) {
        return {
            downloadPdf: function(base64String) {
                function download() {
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
                                    console.log("upload error code " + error.code);
                                }
                            );
                        },
                        false);
                }

                function createDirectory(dataDirectory, directory, replace, successCallback, errorCallback) {
                    //TODO: keep in indexdb
                    $cordovaFile.createDir(dataDirectory, directory, replace)
                        .then(function(success) {
                            console.log('dir created');
                            successCallback();
                        }, function(error) {
                            console.log(error);
                            errorCallback(error);
                        });
                }

                return $http.get($APP.server + '/pub/drawings/' + base64String, {
                        responseType: 'blob'
                    })
                    .success(function(data, status, headers) {
                        $ionicPlatform.ready(function() {
                            if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                                if (typeof cordova == 'undefined') {
                                    cordova = {};
                                    cordova.file = {
                                        dataDirectory: 'local/'
                                    }
                                }





                                // window.resolveLocalFileSystemURL("$APP.server + '/pub/drawings/' + base64String",
                                //     function(fileEntry) {
                                //         fileEntry.file(function(fileObj) {
                                //                 console.log("Size = " + fileObj.size);
                                //             },
                                //             function(error) {
                                //
                                //             });
                                //     },
                                //     function(error) {
                                //
                                //     }
                                // );

                                //cordova.file.applicationDirectory - directory where app is installed
                                //

                                createDirectory(cordova.file.dataDirectory, 'ds-downloads', true,
                                    function() {
                                        download();
                                    },
                                    function(error) {
                                        console.log(error);
                                    });



                                console.log("cordova base dir: " + cordova.file.dataDirectory);
                                document.addEventListener(
                                    "deviceready",
                                    function() {
                                        $cordovaFile.getFreeDiskSpace()
                                            .then(function(success) {
                                                    console.log(success);
                                                    //  success in kilobytes
                                                    // createDirectory(cordova.file.dataDirectory, 'ds-downloads', true,
                                                    //     function() {
                                                    //         download();
                                                    //     },
                                                    //     function(error) {
                                                    //         console.log(error);
                                                    //     });
                                                },
                                                function(error) {
                                                    console.log(error);
                                                });
                                    },
                                    function(error) {
                                        console.log(error);
                                    },
                                    false)
                            }
                        });
                    }).error(function(response) {
                        console.log(response);
                    });
            }
        }
    }
]);
