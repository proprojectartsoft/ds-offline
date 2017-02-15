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
                var def = $q.defer();
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

                                var deviceSpace = 0,
                                    fileSize = 0;
                                cordova.exec(
                                    function(freeSpace) {
                                        deviceSpace = freeSpace;
                                    },
                                    function() {},
                                    "File", "getFreeDiskSpace", []);

                                //TODO: check the size of the file to be downloaded
                                // window.resolveLocalFileSystemURI(
                                //     uri,
                                //     function(fileEntry) {
                                //         fileEntry.file(function(fileObj) {
                                //                 console.log("Size = " + fileObj.size);
                                //                 fileSize = fileObj.size;
                                //             },
                                //             function(error) {});
                                //     },
                                //     function(error) {}
                                // );

                                if (fileSize > deviceSpace - 500) {
                                    def.resolve("");
                                    return;
                                }

                                fileTransfer.download(
                                    uri,
                                    fileURL,
                                    function(entry) {
                                        console.log("download complete: " + entry.toURL());
                                        def.resolve(fileURL);
                                    },
                                    function(error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("upload error code " + error.code);
                                        def.resolve("");
                                    }
                                );
                            },
                            false);
                    } // else def.resolve('fail');
                }).then(function(success) {
                    return def.promise;
                })
            },

            createDirectory: function(dirName) {
                var def = $q.defer();
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
                                def.resolve(cordova.file.dataDirectory + "/" + dirName);
                            }, function(error) {
                                console.log(error);
                                def.resolve('fail');
                            });
                    } //  else def.resolve('fail');
                }).then(function(success) {
                    return def.promise;
                })
            }
        }
    }
]);
