angular.module($APP.name).factory('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    '$q',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer, $q) {
        return {
            downloadPdf: function(dir, base64String) {
                var path = "";
                return $ionicPlatform.ready(function() {
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                        //TODO: check space in directory; check needed space; download if enough
                        document.addEventListener(
                            "deviceready",
                            function() {
                                var fileTransfer = new FileTransfer();
                                var uri = encodeURI($APP.server + '/pub/drawings/' + base64String);
                                var fileURL = dir + "/" + base64String;
                                console.log("file path: " + fileURL);

                                fileTransfer.download(
                                    uri,
                                    fileURL,
                                    function(entry) {
                                        console.log("download complete: " + entry.toURL());
                                        path = fileURL;
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
                }).then(function(success) {
                    return path;
                })
            },

            createDirectory: function(dirName) {
                var path = "";
                return $ionicPlatform.ready(function() {
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                        if (typeof cordova == 'undefined') {
                            cordova = {};
                            cordova.file = {
                                dataDirectory: '///'
                            }
                        }

                        $cordovaFile.createDir(cordova.file.dataDirectory, dirName, true)
                            .then(function(success) {
                                console.log('dir created:');
                                path = cordova.file.dataDirectory + "/" + dirName;
                            }, function(error) {
                                console.log(error);
                                path = "fail";
                            });
                    }
                }).then(function(success) {
                    return path;
                })
            }
        }
    }
]);
