angular.module($APP.name).factory('DownloadsService', [
    '$http',
    '$rootScope',
    'Blob',
    'FileSaver',
    '$ionicPlatform',
    function($http, $rootScope, FileSaver, $ionicPlatform) {
        return {
            downloadPdf: function(base64String) {
                return $http.get($APP.server + '/pub/drawings/' + base64String, {
                        responseType: 'blob'
                    })
                    .success(function(data, status, headers) {
                      $ionicPlatform.ready(function() {

                          if(ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()){

                                fileTransferDir = cordova.file.dataDirectory;
                                var fileURL = fileTransferDir + 'test/test.jpg';

                              // CREATE
                                  $cordovaFile.createDir(fileTransferDir, "test", false)
                                    .then(function (success) {
                                      // success
                                      console.log('dir created');
                                      console.log(success);
                                    }, function (error) {
                                      // error
                                      console.log(error);
                                    });

                              // Download

                              var fileTransfer = new FileTransfer();
                              var uri = encodeURI("http://ionicframework.com/img/ionic-logo-blog.png");

                              fileTransfer.download(
                                  uri,
                                  fileURL,
                                  function(entry) {
                                      console.log("download complete: " + entry.toURL());
                                      $scope.Path=fileURL;
                                  },
                                  function(error) {
                                      console.log("download error source " + error.source);
                                      console.log("download error target " + error.target);
                                      console.log("upload error code" + error.code);
                                  }
                              );
                          }
                      })



















                      //   var filename,
                      //       octetStreamMime = "application/octet-stream",
                      //       contentType;
                       //
                      //   //  headers = headers();
                       //
                      //   if (!filename) {
                      //       filename = base64String || 'invoice.pdf';
                      //   }
                       //
                      //   contentType = 'application/pdf' || octetStreamMime;
                       //
                      //   var blob = new Blob([data], {
                      //       type: contentType
                      //   });
                      //  saveAs(blob, filename);
                    }).error(function(response) {
                        console.log(response);
                    });
            }
        };
    }
]);
