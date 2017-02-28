angular.module($APP.name).controller('DefectsCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    '$filter',
    'DefectsService',
    'ConvertersService',
    '$ionicViewSwitcher',
    '$ionicModal',
    '$indexedDB',
    'DrawingsService',
    '$ionicPopup',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, $filter, DefectsService, ConvertersService, $ionicViewSwitcher, $ionicModal, $indexedDB, DrawingsService, $ionicPopup) {
        $scope.settings = {};
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = localStorage.getObject('dsproject');
        $scope.local = {};
        $scope.local.entityId = $stateParams.id;
        localStorage.setObject('ds.fullscreen.back', {
            id: $stateParams.id,
            state: 'app.defects'
        })
        localStorage.removeItem('ds.reloadevent');

        $ionicModal.fromTemplateUrl('templates/defects/_drawings.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });

        var setPdf = function(url) {
            $timeout(function() {
                PDFJS.getDocument(url).then(function(pdf) {
                    pdf.getPage(1).then(function(page) {
                        var widthToBe = 480;
                        var viewport = page.getViewport(1);
                        var scale = widthToBe / viewport.width;
                        var usedViewport = page.getViewport(scale);
                        var canvas = document.getElementById('defectPreviewCanvas');
                        var context = canvas.getContext('2d');
                        canvas.height = usedViewport.height;
                        canvas.width = usedViewport.width;
                        canvas.onclick = function(event) {}
                        var renderContext = {
                            canvasContext: context,
                            viewport: usedViewport
                        };
                        page.render(renderContext).then(function() {
                            var width = $("#defectPreviewCanvas").width();
                            $scope.perc = width / 12;
                            if ($scope.local.drawing && $scope.local.drawing.markers && $scope.local.drawing.markers.length) {
                                $scope.$apply(function() {
                                    $scope.local.marker = {};
                                    $scope.local.marker.id = $scope.local.drawing.markers[0].id;
                                    $scope.local.marker.x = $scope.local.drawing.markers[0].position_x * ($scope.perc / 100) - 6;
                                    $scope.local.marker.y = $scope.local.drawing.markers[0].position_y * ($scope.perc / 100) - 6;
                                    $scope.local.marker.status = $scope.local.drawing.markers[0].status;
                                })

                            }
                        })
                    });
                });
            });
        }
        var showEmpty = function() {
            $timeout(function() {
                var canvas = document.getElementById('defectPreviewCanvas');
                var ctx = canvas.getContext('2d');
                ctx.font = "14px 'Roboto Condensed'";
                var x = canvas.width / 2;
                ctx.textAlign = "center";
                ctx.fillText("No Drawing Available", x, 80);
            });
        };
        var addDrawing = function() {
            $timeout(function() {
                var canvas = document.getElementById('defectPreviewCanvas');
                var ctx = canvas.getContext('2d');
                ctx.font = "14px 'Roboto Condensed'";
                var x = canvas.width / 2;
                ctx.textAlign = "center";
                ctx.fillText("Click to select a drawing.", x, 80);
                canvas.onclick = function(event) {
                    modalDrawing();
                }
            });
        };
        var modalDrawing = function() { //TODO:
            DrawingsService.list_light($scope.settings.project.id).then(function(result) {
                angular.forEach(result, function(draw) {
                    draw.path = $APP.server + '/pub/drawings/' + draw.path;
                    draw.resized_path = $APP.server + '/pub/drawings/' + draw.resized_path;
                })
                $scope.local.drawingsLight = result;
            })
            $scope.modal.show();
        }
        $scope.closePopup = function() {
            $scope.modal.hide();
        };
        $scope.selectDrawing = function(data) {
            $scope.local.drawing = data;
            localStorage.setObject('ds.defect.drawing', data);
            $scope.go('fullscreen', $scope.local.drawing.id);
            $scope.modal.hide();
        }
        $scope.getFullscreen = function() {
            if ($stateParams.id !== "0") {
                $scope.go('fullscreen', $scope.local.data.drawing.id);
            } else {
                $scope.go('fullscreen', $scope.local.drawing.id);
            }
        }

        function newDefect() {
            $rootScope.disableedit = false;
            $rootScope.thiscreate = true;
            if (localStorage.getObject('ds.drawing.defect') && !localStorage.getObject('ds.defect.drawing')) {
                $scope.local.drawing = localStorage.getObject('ds.drawing.defect')
                localStorage.setObject('ds.defect.drawing', $scope.local.drawing)
            } else {
                $scope.local.drawing = localStorage.getObject('ds.defect.drawing');
            }
            if ($scope.local.drawing && $scope.local.drawing.path) {
                setPdf($scope.local.drawing.path)
            } else {
                addDrawing()
            }
            if (!localStorage.getObject('ds.defect.new.data')) {
                $scope.local.data = {};
                $scope.local.data.id = 0;
                $scope.local.data.active = true;
                $scope.local.data.project_id = $scope.settings.project.id;
                $scope.local.data.defect_id = 0;
                $scope.local.data.related_tasks = [];
                $scope.local.data.status_obj = {
                    id: 0,
                    name: 'Incomplete'
                };
                $scope.local.data.severity_obj = {
                    id: 0,
                    name: 'None'
                };
                $scope.local.data.priority_obj = {
                    id: 0,
                    name: 'None'
                };
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject').id).then(function(project) {
                        angular.forEach(project.users, function(user) {
                            if (user.login_name == localStorage.getObject('ds.user').name) {
                                $scope.local.data.assignee_name = user.first_name + " " + user.last_name;
                                $scope.local.data.assignee_id = user.id;
                                localStorage.setObject('ds.defect.new.data', $scope.local.data);
                            }
                        })
                    })
                })
            } else {
                $scope.local.data = localStorage.getObject('ds.defect.new.data');
            }

            $scope.settings.subHeader = 'New defect'
            localStorage.removeItem('ds.defect.active.data')
        }

        function existingDefect() {
            if ($rootScope.disableedit === undefined) {
                $rootScope.disableedit = true;
            }
            $rootScope.thiscreate = false;
            if (!localStorage.getObject('ds.defect.active.data') || localStorage.getObject('ds.defect.active.data').id !== parseInt($stateParams.id)) {
                $indexedDB.openStore('projects', function(store) {
                    store.find(localStorage.getObject('dsproject').id).then(function(res) {
                        angular.forEach(res.defects, function(defect) {
                            if (defect.id == $stateParams.id) {
                                $scope.local.data = ConvertersService.init_defect(defect.completeInfo);
                                localStorage.setObject('ds.defect.active.data', $scope.local.data)
                                $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
                                if ($scope.local.data.drawing && $scope.local.data.drawing.pdfPath) {
                                    $scope.local.data.drawing.path = $scope.local.data.drawing.pdfPath;
                                    $scope.local.drawing = $scope.local.data.drawing;
                                    localStorage.setObject('ds.defect.drawing', $scope.local.data.drawing);
                                    setPdf($scope.local.data.drawing.pdfPath);
                                } else {
                                    showEmpty()
                                }
                            }
                        })
                    })
                })
            } else {
                $scope.local.data = ConvertersService.init_defect(localStorage.getObject('ds.defect.active.data'));
                $scope.settings.subHeader = 'Defect - ' + $scope.local.data.title;
                if ($scope.local.data.drawing && $scope.local.data.drawing.pdfPath) {
                    $scope.local.data.drawing.path = $scope.local.data.drawing.pdfPath;
                    $scope.local.drawing = localStorage.getObject('ds.defect.drawing');
                    setPdf($scope.local.data.drawing.pdfPath);
                } else {
                    showEmpty()
                }
            }
        }

        $scope.toggleEdit = function() {
            $rootScope.disableedit = false;
            localStorage.setObject('ds.defect.backup', $scope.local.data)
        }
        $scope.cancelEdit = function() {
            $scope.local.data = localStorage.getObject('ds.defect.backup')
            localStorage.setObject('ds.defect.active.data', $scope.local.data)
            localStorage.removeItem('ds.defect.backup')
            $rootScope.disableedit = true;
        }

        $scope.saveEdit = function() {
            $rootScope.disableedit = true;
            $indexedDB.openStore("projects", function(store) {
                store.find(localStorage.getObject('dsproject').id).then(function(project) {
                    angular.forEach(project.defects, function(defect) {
                        if (defect.id == $scope.local.data.id) {
                            var old_assignee_id = defect.completeInfo.assignee_id;
                            defect.completeInfo = ConvertersService.save_defect($scope.local.data);
                            defect.status_name = defect.completeInfo.status_name;
                            defect.priority_name = defect.completeInfo.priority_name;
                            defect.severity_name = defect.completeInfo.severity_name;
                            defect.title = defect.completeInfo.title;
                            if (typeof defect.isNew == 'undefined')
                                defect.isModified = true;
                            project.isModified = true;

                            angular.forEach(project.drawings, function(draw) {
                                if (draw.id == defect.completeInfo.drawing.id) {
                                    angular.forEach(draw.markers, function(mark) {
                                        if (mark.defect_id == defect.id) {
                                            mark.status = defect.completeInfo.drawing.markers[0].status;
                                        }
                                    })
                                }
                            })
                            //assignee changes
                            if (old_assignee_id != defect.completeInfo.assignee_id) {
                                angular.forEach(project.subcontractors, function(subcontr) {
                                    //remove from old assignee related list
                                    if (subcontr.id == old_assignee_id) {
                                        angular.forEach(subcontr.related, function(rel) {
                                            if (rel.id == defect.id) {
                                                subcontr.related = $filter('filter')(subcontr.related, {
                                                    id: ('!' + rel.id)
                                                });
                                            }
                                        })
                                    }
                                    //add to new assignee related list
                                    else if (subcontr.id == defect.completeInfo.assignee_id) {
                                        subcontr.related.push(defect.completeInfo);
                                    }
                                })
                            }
                        }
                    })
                    saveChanges(project);
                    localStorage.setObject('ds.defect.active.data', $scope.local.data)
                    localStorage.removeItem('ds.defect.backup')
                    localStorage.setObject('ds.reloadevent', {
                        value: true
                    });
                })
            })
        }
        $scope.saveCreate = function() { //TODO:
            if ($scope.local.drawing && $scope.local.drawing.markers && $scope.local.drawing.markers.length && $scope.local.data.title) {
                $rootScope.disableedit = true;
                var nextId = 0;
                $indexedDB.openStore("projects", function(store) {
                    store.getAll().then(function(res) {
                        angular.forEach(res, function(proj) {
                            angular.forEach(proj.defects, function(defect) {
                                if (defect.id > nextId)
                                    nextId = defect.id;
                            })
                        })
                    })
                })
                $indexedDB.openStore("projects", function(store) {
                    store.find(localStorage.getObject('dsproject').id).then(function(project) {
                        var newDef = ConvertersService.save_defect($scope.local.data);
                        newDef.id = nextId + 1;
                        var localStorredDef = {};
                        localStorredDef.isNew = true;
                        localStorredDef.assignee_name = newDef.assignee_name;
                        localStorredDef.attachements = [];
                        localStorredDef.comments = [];
                        localStorredDef.id = newDef.id;
                        localStorredDef.priority_name = newDef.priority_name;
                        localStorredDef.severity_name = newDef.severity_name;
                        localStorredDef.status_name = newDef.status_name;
                        localStorredDef.title = newDef.title;
                        localStorredDef.completeInfo = newDef;
                        //TODO: add attachements and comments





                        angular.forEach(project.subcontractors, function(subcontr) {
                            if (subcontr.id == newDef.assignee_id) {
                                subcontr.related.push(newDef);
                            }
                        })

                        localStorage.setObject('ds.defect.active.data', $scope.local.data);
                        localStorage.removeItem('ds.defect.backup');
                        angular.forEach(project.drawings, function(drawing) {
                            if (drawing.id == $scope.local.drawing.id) {
                                var aux = angular.copy($scope.local.drawing.markers[0])
                                aux.defect_id = nextId + 1;
                                aux.drawing_id = $scope.local.drawing.id;
                                aux.position_x = aux.xInit;
                                aux.position_y = aux.yInit;
                                drawing.markers.push(aux);
                                aux.status = localStorredDef.status_name;
                                localStorredDef.draw = drawing;
                                localStorredDef.completeInfo.drawing = ConvertersService.save_local(drawing);
                                localStorredDef.completeInfo.drawing.markers.push(aux);
                                project.defects.push(localStorredDef);
                                project.isModified = true;
                                saveChanges(project);

                                localStorage.removeItem('dsdrwact');
                                localStorage.setObject('ds.reloadevent', {
                                    value: true
                                });
                                $scope.back();
                            }
                        })
                    })
                })
            } else {
                var alertPopup = $ionicPopup.show({
                    title: 'Error',
                    template: 'Make sure you have for your new defect a title, a drawing and a marker.',
                    buttons: [{
                        text: 'Ok',
                    }]
                });

                alertPopup.then(function(res) {});
            }
        }

        function saveChanges(project) {
            $indexedDB.openStore('projects', function(store) {
                store.upsert(project).then(
                    function(e) {
                        store.find(localStorage.getObject('dsproject').id).then(function(project) {})
                    },
                    function(e) {
                        var offlinePopup = $ionicPopup.alert({
                            title: "Unexpected error",
                            template: "<center>An unexpected error has occurred.</center>",
                            content: "",
                            buttons: [{
                                text: 'Ok',
                                type: 'button-positive',
                                onTap: function(e) {
                                    offlinePopup.close();
                                }
                            }]
                        });
                    })
            })
        }

        if ($stateParams.id === "0") {
            newDefect();
        } else {
            existingDefect()
        }

        $scope.back = function() {
            var routeback = localStorage.getObject('ds.defect.back')
            if ($stateParams.id === '0') {
                localStorage.removeItem('ds.defect.new.data');
            } else {
                localStorage.removeItem('ds.defect.active.data');
            }
            localStorage.removeItem('ds.drawing.defect')
            localStorage.removeItem('ds.defect.drawing');
            $rootScope.disableedit = true;
            $ionicViewSwitcher.nextDirection('back')
            if (routeback) {
                $state.go(routeback.state, {
                    id: routeback.id
                });
            } else {
                $state.go('app.tab')
            }
        }
        $scope.go = function(predicate, item) {
            $state.go('app.' + predicate, {
                id: item
            });
        }
    }
]);
