angular.module($APP.name).factory('SyncService', [
    '$q',
    '$http',
    '$rootScope',
    '$indexedDB',
    '$state',
    '$timeout',
    '$ionicPopup',
    'ProjectService',
    'DrawingsService',
    'SubcontractorsService',
    'DefectsService',
    'DownloadsService',
    function($q, $http, $rootScope, $indexedDB, $state, $timeout, $ionicPopup, ProjectService, DrawingsService, SubcontractorsService, DefectsService, DownloadsService) {
        return {
            sync: function() {
                $timeout(function() {
                    var deferred = $q.defer();
                    var failed = false;

                    if (navigator.onLine) {
                        var syncPopup = $ionicPopup.alert({
                            title: "Syncing",
                            template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                            content: "",
                            buttons: []
                        });

                        function syncData() {
                            var def = $q.defer();
                            $indexedDB.openStore('projects', function(store) {
                                store.getAll().then(function(projects) {
                                    if (projects.length != 0) {

                                        //TODO: save each new pdf to server: DrawingsService.storeNewPdf
                                        def.resolve();
                                    } else {
                                        def.resolve();
                                    }
                                })
                            })
                            return def.promise;
                        }

                        function getProjects() {
                            var def = $q.defer();
                            syncData().then(function() {
                                DownloadsService.createDirectory("ds-downloads").then(function(res) {
                                    if (res == 'fail')
                                        failed = true;
                                    ProjectService.list().then(function(projects) {
                                        angular.forEach(projects, function(project) {
                                            DrawingsService.list(project.id).then(function(drawings) {
                                                project.drawings = drawings;
                                                if (!failed) {
                                                    angular.forEach(drawings, function(draw) {
                                                        DrawingsService.get_original(draw.id).then(function(result) {
                                                            DownloadsService.downloadPdf(res, result.base64String).then(function(downloadRes) {
                                                                if (downloadRes == "" || downloadRes == 'fail') {
                                                                    failed = true;
                                                                    def.resolve(projects);
                                                                    return;
                                                                }
                                                                draw.base64String = downloadRes;
                                                            })
                                                            draw.base64String = "downloadRes";
                                                        })
                                                    })
                                                }
                                            })

                                            SubcontractorsService.list(project.id).then(function(subcontractors) {
                                                project.subcontractors = subcontractors;
                                            })

                                            DefectsService.list_small(project.id).then(function(defects) {
                                                project.defects = defects;
                                            })

                                            if ((projects[projects.length - 1] === project)) {
                                                $timeout(function() {
                                                    def.resolve(projects)
                                                }, 5000);
                                            }
                                        })
                                    })
                                })
                            })
                            return def.promise;
                        }

                        function storeToIndexDb(projects) {
                            $indexedDB.openStore('projects', function(store) {
                                store.clear();
                            }).then(function(e) {
                                angular.forEach(projects, function(project) {
                                    $indexedDB.openStore('projects', function(store) {
                                        project.op = 0;
                                        store.insert({
                                            "id": project.id,
                                            "value": project
                                        }).then(function(e) {
                                            if (projects[projects.length - 1] === project) {
                                                syncPopup.close();
                                                $state.go('app.projects');
                                                deferred.resolve('sync_done');
                                            }
                                        });
                                    })
                                })
                            })
                        }

                        getProjects().then(function(projects) {
                            if (failed == true) {
                                var downloadPopup = $ionicPopup.alert({
                                    title: "Download stopped",
                                    template: "<center>Not enough space to download all files</center>",
                                    content: "",
                                    buttons: [{
                                        text: 'Ok',
                                        type: 'button-positive',
                                        onTap: function(e) {
                                            storeToIndexDb(projects);
                                            downloadPopup.close();
                                        }
                                    }]
                                });
                            }
                        })
                    } else {
                        var savedCredentials = localStorage.getObject('dsremember');
                        var offlinePopup = $ionicPopup.alert({
                            title: "You are offline",
                            template: "<center>You cannot sync your data when offline</center>",
                            content: "",
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive',
                                onTap: function(e) {
                                    offlinePopup.close();
                                }
                            }]
                        });
                        // if (savedCredentials) {
                        //     $state.go('login');
                        // }
                    }
                    return deferred.promise;
                })
            }
        }
    }
]);
