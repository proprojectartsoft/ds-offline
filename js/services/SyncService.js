angular.module($APP.name).factory('SyncService', [
    '$q',
    '$http',
    '$rootScope',
    '$indexedDB',
    '$state',
    '$timeout',
    '$ionicPopup',
    '$ionicPlatform',
    'orderByFilter',
    'ProjectService',
    'DrawingsService',
    'SubcontractorsService',
    'DefectsService',
    'DownloadsService',
    function($q, $http, $rootScope, $indexedDB, $state, $timeout, $ionicPopup, $ionicPlatform, orderBy, ProjectService, DrawingsService, SubcontractorsService, DefectsService, DownloadsService) {
        return {
            sync: function() {
                $timeout(function() {
                    var deferred = $q.defer();
                    var failed = false;

                    if (navigator.connection.type != Connection.NONE && navigator.connection.type != Connection.UNKNOWN) {
                        var syncPopup = $ionicPopup.alert({
                            title: "Syncing",
                            template: "<center><ion-spinner icon='android'></ion-spinner></center>",
                            content: "",
                            buttons: []
                        });

                        function storeNewDefects(project) {
                            var comments = localStorage.getObject('commentsToAdd') || [];
                            var related = localStorage.getObject('defectRelToAdd') || [];
                            var attach = localStorage.getObject('attachToAdd') || [];
                            var defects = localStorage.getObject('defectsToAdd') || [];
                            var defectsToUpd = localStorage.getObject('defectsToUpd') || [];
                            angular.forEach(project.defects, function(defect) {
                                if (typeof defect.isModified != 'undefined' || typeof defect.isNew != 'undefined') {
                                    angular.forEach(defect.comments, function(comment) {
                                        if (typeof comment.isNew != 'undefined') {
                                            delete comment.isNew;
                                            comments.push(comment);
                                        }
                                    })
                                    // TODO:
                                    // angular.forEach(defect.attachements, function(att) {
                                    // if (typeof att.isNew != 'undefined') {
                                    // delete att.isNew
                                    // attach.push(att);
                                    // }
                                    // })
                                }
                                if (typeof defect.isNew != 'undefined') {
                                    delete defect.isNew;
                                    defects.push(defect);
                                }
                                if (typeof defect.isModified != 'undefined') {
                                    delete defect.isModified;
                                    defectsToUpd.push(defect.completeInfo);
                                }
                                delete defect.isNew;
                                delete defect.isModified;
                            })

                            localStorage.setObject('commentsToAdd', comments);
                            localStorage.setObject('defectRelToAdd', related);
                            localStorage.setObject('attachToAdd', attach);
                            localStorage.setObject('defectsToAdd', defects);
                            localStorage.setObject('defectsToUpd', defectsToUpd);
                        }

                        function storeNewSubcontractors(project) {
                            var related = localStorage.getObject('defectsToUpd') || [];
                            angular.forEach(project.subcontractors, function(subcontr) {
                                if (typeof subcontr.isModified != 'undefined') {
                                    angular.forEach(subcontr.related, function(rel) {
                                        if (typeof rel.isNew != 'undefined') {
                                            delete rel.isNew;
                                            related.push(rel.completeInfo);
                                        }
                                    })
                                    delete subcontr.isModified;
                                }
                            })
                            localStorage.setObject('defectsToUpd', related);
                        }

                        function syncData() {
                            var def = $q.defer();
                            $indexedDB.openStore('projects', function(store) {
                                store.getAll().then(function(projects) {
                                    if (projects.length != 0) {
                                        angular.forEach(projects, function(project) {
                                            if (project.isModified) {
                                                storeNewDefects(project);
                                                storeNewSubcontractors(project);
                                                delete project.isModified;
                                            }
                                        })
                                        angular.forEach(localStorage.getObject('commentsToAdd'), function(comment) {
                                            DefectsService.create_comment(comment).then(function(res) {
                                                localStorage.setObject('commentsToAdd', []);
                                            })
                                        })
                                        // TODO:
                                        // angular.forEach(localStorage.getObject('attachToAdd'), function(attach) {
                                        // DefectsService.create_photos(attach);
                                        // localStorage.setObject('attachToAdd', []);
                                        // })
                                        if (localStorage.getObject('defectsToAdd') == null || localStorage.getObject('defectsToAdd').length == 0) {
                                            def.resolve();
                                        }

                                        angular.forEach(localStorage.getObject('defectsToAdd'), function(defect) {
                                            var draw = defect.draw;
                                            DefectsService.create(defect.completeInfo).then(function(res) {
                                                DrawingsService.update(draw).then(function(drawingupdate) {
                                                    if (localStorage.getObject('defectsToAdd')[localStorage.getObject('defectsToAdd').length - 1].id == defect.id)
                                                        def.resolve();
                                                });
                                            })
                                            localStorage.setObject('defectsToAdd', []);
                                        })
                                        angular.forEach(localStorage.getObject('defectsToUpd'), function(defect) {
                                            DefectsService.update(defect).then(function(res) {
                                                localStorage.setObject('defectsToUpd', []);
                                            })
                                        })
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
                                                defect.completeInfo.drawing.pdfPath = draw.pdfPath;
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

                        function createDrawings(drawings, doDownload, path, def) {
                            angular.forEach(drawings, function(draw) {
                                DrawingsService.list_defects(draw.draw.id).then(function(result) {
                                    draw.draw.relatedDefects = result;
                                })
                                DrawingsService.get_original(draw.draw.id).then(function(result) {
                                    draw.draw.base64String = result.base64String;
                                    if (doDownload) {
                                        DownloadsService.downloadPdf(result, path).then(function(downloadRes) {
                                            if (downloadRes == "") {
                                                failed = true;
                                                draw.draw.pdfPath = $APP.server + '/pub/drawings/' + result.base64String;
                                                if (drawings[drawings.length - 1] === draw)
                                                    def.resolve();
                                                // return;
                                            } else {
                                                draw.draw.pdfPath = downloadRes;
                                                if (drawings[drawings.length - 1] === draw)
                                                    def.resolve();
                                            }
                                        })
                                    } else {
                                        draw.draw.pdfPath = $APP.server + '/pub/drawings/' + result.base64String;
                                        if (drawings[drawings.length - 1] === draw)
                                            def.resolve();
                                    }
                                })
                            })
                        }

                        function getAllDrawings(projects, doDownload, path) {
                            var def = $q.defer();
                            var draws = [];
                            angular.forEach(projects, function(project) {
                                DrawingsService.list(project.id).then(function(drawings) {
                                    project.drawings = drawings;
                                    angular.forEach(project.drawings, function(draw) {
                                        draws.push({
                                            "proj": project,
                                            "draw": draw
                                        });
                                    })
                                    if (projects[projects.length - 1] === project) {
                                        if (draws.length == 0) {
                                            def.resolve();
                                            return;
                                        }
                                        var orderedDraws = orderBy(draws, 'draw.drawing_date', true);
                                        createDrawings(orderedDraws, doDownload, path, def);
                                    }
                                })
                            })
                            return def.promise;
                        }

                        function createData(doDownload, path, def) {
                            ProjectService.list().then(function(projects) {
                                getAllDrawings(projects, doDownload, path).then(function() {
                                    angular.forEach(projects, function(project) {
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
                                        store.insert(project).then(function(e) {
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
                                            //TODO: allow clicks
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
