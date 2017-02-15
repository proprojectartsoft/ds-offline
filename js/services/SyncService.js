angular.module($APP.name).factory('SyncService', [
    '$q',
    '$http',
    '$rootScope',
    '$indexedDB',
    '$state',
    '$timeout',
    '$ionicPopup',
    '$ionicPlatform',
    'ProjectService',
    'DrawingsService',
    'SubcontractorsService',
    'DefectsService',
    'DownloadsService',
    function($q, $http, $rootScope, $indexedDB, $state, $timeout, $ionicPopup, $ionicPlatform, ProjectService, DrawingsService, SubcontractorsService, DefectsService, DownloadsService) {
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

                        function createDefects(project) {
                            DefectsService.list_small(project.id).then(function(defects) {
                                project.defects = defects;
                                angular.forEach(project.defects, function(defect) {
                                    DefectsService.get(defect.id).then(function(result) {
                                        defect.completeInfo = result;
                                        angular.forEach(project.drawings, function(draw) {
                                            if (defect.completeInfo.drawing != null && draw.id == defect.completeInfo.drawing.id) {
                                                defect.completeInfo.drawing = draw;
                                            }
                                        })
                                    })
                                    DefectsService.list_comments(defect.id).then(function(result) {
                                        defect.comments = result;
                                    })
                                    DefectsService.list_photos(defect.id).then(function(result) {
                                        defect.attachements = result;
                                    })
                                })
                            })
                        }

                        function createSubcontractors(project) {
                            SubcontractorsService.list(project.id).then(function(subcontractors) {
                                project.subcontractors = subcontractors;
                                angular.forEach(project.subcontractors, function(subcontr) {
                                    SubcontractorsService.list_defects(project.id, subcontr.id).then(function(result) {
                                        subcontr.related = result;
                                    })
                                })
                            })
                        }

                        function createDrawings(project, doDownload, path, def) {
                            DrawingsService.list(project.id).then(function(drawings) {
                                project.drawings = drawings;
                                angular.forEach(project.drawings, function(draw) {
                                    DrawingsService.list_defects(draw.id).then(function(result) {
                                        draw.relatedDefects = result;
                                    })
                                    DrawingsService.get_original(draw.id).then(function(result) {
                                        if (doDownload) {
                                            DownloadsService.downloadPdf(path, result.base64String).then(function(downloadRes) {
                                                if (downloadRes == "") {
                                                    failed = true;
                                                    draw.pdfPath = downloadRes;
                                                    return;
                                                }
                                                draw.pdfPath = $APP.server + '/pub/drawings/' + result.base64String;
                                            })
                                        } else {
                                            draw.pdfPath = $APP.server + '/pub/drawings/' + result.base64String;
                                        }
                                    })
                                })
                            })
                        }

                        function createData(doDownload, path, def) {
                            ProjectService.list().then(function(projects) {
                                angular.forEach(projects, function(project) {
                                    createDrawings(project, doDownload, path, def);
                                    createSubcontractors(project);
                                    createDefects(project);
                                    ProjectService.users(project.id).then(function(result) {
                                        project.users = result;
                                    })
                                    if ((projects[projects.length - 1] === project)) {
                                        $timeout(function() {
                                            def.resolve(projects)
                                        }, 5000);
                                    }
                                })
                            })
                        }

                        function getProjects() {
                            var def = $q.defer();
                            syncData().then(function() {
                                $ionicPlatform.ready(function() {
                                    if (ionic.Platform.isIPad() || ionic.Platform.isAndroid() || ionic.Platform.isIOS()) {
                                        DownloadsService.createDirectory("ds-downloads").then(function(res) {
                                            if (res == 'fail') {
                                                failed = true;
                                                createData(false, res, def);
                                            } else
                                                createData(true, res, def);
                                        })
                                    } else {
                                        createData(false, "", def);
                                        failed = true;
                                    }
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
                                            downloadPopup.close();
                                        }
                                    }]
                                });
                            }
                            storeToIndexDb(projects);
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
