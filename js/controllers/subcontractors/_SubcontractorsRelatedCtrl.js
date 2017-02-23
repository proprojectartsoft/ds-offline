angular.module($APP.name).controller('_SubcontractorsRelatedCtrl', [
    '$rootScope',
    '$scope',
    '$stateParams',
    '$state',
    'SettingsService',
    '$timeout',
    'SubcontractorsService',
    '$ionicModal',
    '$indexedDB',
    'DefectsService',
    'SubcontractorsService',
    function($rootScope, $scope, $stateParams, $state, SettingsService, $timeout, SubcontractorsService, $ionicModal, $indexedDB, DefectsService, SubcontractorsService) {
        $scope.settings = {};
        $scope.settings.header = SettingsService.get_settings('header');
        $scope.settings.subHeader = SettingsService.get_settings('subHeader');
        $scope.settings.tabActive = SettingsService.get_settings('tabActive');
        $scope.settings.project = localStorage.getObject('dsproject');
        $scope.settings.state = 'related';
        $scope.local = {};
        $scope.local.data = localStorage.getObject('dsscact');
        $scope.local.entityId = $stateParams.id;
        $scope.local.loaded = false;
        $scope.settings.subHeader = 'Subcontractor - ' + $scope.local.data.last_name + ' ' + $scope.local.data.first_name;

        $indexedDB.openStore('projects', function(store) {
            store.find(localStorage.getObject('dsproject').id).then(function(res) {
                angular.forEach(res.subcontractors, function(subcontr) {
                    if (subcontr.id == $scope.local.data.id) {
                        $scope.local.list = subcontr.related;
                        $scope.local.loaded = true;
                        $scope.local.poplist = [];

                        for (var i = 0; i < res.defects.length; i++) {
                            var sw = true;
                            for (var j = 0; j < subcontr.related.length; j++) {
                                if (res.defects[i].id === subcontr.related[j].id) {
                                    sw = false;
                                }
                            }
                            if (sw) {
                                $scope.local.poplist.push(res.defects[i]);
                            }
                        }
                    }
                })
            })
        })

        $scope.goItem = function(item) {
            $scope.settings.subHeader = item.name;
            SettingsService.set_settings($scope.settings)
            $state.go('app.defects', {
                id: item
            })
        }
        $scope.getInitials = function(str) {
            var aux = str.split(" ");
            return (aux[0][0] + aux[1][0]).toUpperCase();
        }
        $scope.back = function() {
            $state.go('app.subcontractors', {
                id: $stateParams.id
            })
        }
        $ionicModal.fromTemplateUrl('templates/defects/_popover.html', {
            scope: $scope
        }).then(function(modal) {
            $scope.modal = modal;
        });
        // Triggered in the login modal to close it
        $scope.closePopup = function() {
            $scope.modal.hide();
        };
        // Open the login modal
        $scope.related = function() {
            $scope.modal.show();
        };

        $scope.addRelated = function(related) {
            $scope.modal.hide();
            $indexedDB.openStore('projects', function(store) {
                store.find($scope.settings.project.id).then(function(project) {
                    angular.forEach(project.subcontractors, function(subcontr) {
                        if (subcontr.id == $scope.local.data.id) {
                            angular.forEach(project.defects, function(defect) {
                                if (defect.id == related.id) {
                                    defect.assignee_id = $stateParams.id;
                                    angular.forEach(project.subcontractors, function(sub) {
                                      if(sub.id == $stateParams.id){
                                        defect.assignee_name = sub.first_name + " " + sub.last_name;
                                      }
                                    })
                                    defect.completeInfo.assignee_id = $stateParams.id;
                                    defect.isNew = true;
                                    subcontr.isModified = true;
                                    project.isModified = true;
                                    subcontr.related.push(defect);
                                    saveChanges(project);
                                    $scope.local.list = subcontr.related;
                                    var defects = angular.copy($scope.local.poplist)

                                    $scope.local.poplist = [];
                                    for (var i = 0; i < defects.length; i++) {
                                        var sw = true;
                                        for (var j = 0; j < subcontr.length; j++) {
                                            if (defects[i].id === result[j].id) {
                                                sw = false;
                                            }
                                        }
                                        if (sw) {
                                            $scope.local.poplist.push(defects[i]);
                                        }
                                    }
                                    $scope.local.loaded = true;
                                }
                            })
                        }
                    })
                })
            })
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
                            template: "<center>An unexpected error occurred while trying to add a defect</center>",
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
    }
]);

angular.module($APP.name).filter('capitalize', function() {
    return function(input) {
        return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});
