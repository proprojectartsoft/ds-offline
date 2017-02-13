angular.module($APP.name).factory('DownloadsService', [
    '$http',
    '$rootScope',
    '$ionicPlatform',
    '$cordovaFile',
    '$cordovaFileTransfer',
    function($http, $rootScope, $ionicPlatform, $cordovaFile, $cordovaFileTransfer) {
        return {
            downloadPdf: function(path, base64String) {
                return $ionicPlatform.ready(function() {
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {

                        document.addEventListener(
                            "deviceready",
                            function() {
                                var fileTransfer = new FileTransfer();
                                var uri = encodeURI("$APP.server + '/pub/drawings/' + base64String");
                                var fileURL = path + "/" + base64String;
                                console.log("file path: " + fileURL);

                                fileTransfer.download(
                                    uri,
                                    fileURL,
                                    function(entry) {
                                        console.log("download complete: " + entry.toURL());
                                        //$scope.Path = fileURL;
                                    },
                                    function(error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("upload error code " + error.code);
                                    }
                                );
                            },
                            false);

                        //TODO: check space in directory; check needed space; download if enough
                    }
                });
            },

            createDirectory: function(dirName) {
                $ionicPlatform.ready(function() {
                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                        if (typeof cordova == 'undefined') {
                            cordova = {};
                            cordova.file = {
                                dataDirectory: '///'
                            }
                        }

                        $cordovaFile.createDir(cordova.file.dataDirectory, dirName, false)
                            .then(function(success) {
                                console.log('dir created:');
                                console.log(success);
                                return cordova.file.dataDirectory + "/" + dirName;
                            }, function(error) {
                                console.log(error);
                                return false;
                            });
                    }
                })
            }
        }
    }
]);
