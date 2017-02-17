angular.module($APP.name).controller('ProjectsCtrl', [
    '$rootScope',
    '$state',
    '$scope',
    '$ionicSideMenuDelegate',
    '$timeout',
    '$ionicPopup',
    '$ionicModal',
    '$indexedDB',
    'ProjectService',
    function($rootScope, $state, $scope, $ionicSideMenuDelegate, $timeout, $ionicPopup, $ionicModal, $indexedDB, ProjectService) {
        $rootScope.navTitle = 'Projects';
        $rootScope.projects = [];
        localStorage.setObject('dsnavTitle', 'Choose a project');
        $scope.local = {};
        $scope.local.createProject = {}
        $scope.local.user = localStorage.getObject('ds.user')

        $indexedDB.openStore('projects', function(store) {
            store.getAll().then(function(res) {
                angular.forEach(res, function(proj) {
                    $rootScope.projects.push(proj);
                })

                console.log($rootScope.projects); //TODO:delete comment
                var aux = localStorage.getObject('dsproject')
                if (aux) {
                    angular.forEach($rootScope.projects, function(value, key) {
                        if (value.id == aux.id) {
                            $scope.local.activeProject = value;
                        }
                    });
                }
            })
        })

        $scope.go = function(item) {
            localStorage.setObject('dsproject', item);
            localStorage.setObject('dsnavTitle', item.name);
            $state.go('app.tab', {
                page: 'drawings'
            });

        }
        $scope.doShow = function() {
            $scope.picModal.hide();
            $scope.picModal.remove();
        };

        $scope.showPopup = function() {
            $ionicPopup.show({
                template: '',
                title: 'Create project',
                scope: $scope,
                templateUrl: 'templates/projects/_create.html',
                buttons: [{
                    text: 'Cancel',
                    onTap: function(e) {
                        return 'close';
                    }
                }, {
                    text: 'Create',
                    onTap: function(e) {
                        if ($scope.local.createProject.project_number && $scope.local.createProject.name && $scope.local.createProject.addr_firstline) {
                            return $scope.local.createProject;
                        } else {
                            e.preventDefault();
                        }
                    }
                }]
            }).then(function(res) {
                if (res.name) {
                    res.drawings = [];
                    res.subcontractors = [];
                    res.defects = [];
                    res.isNew = true;
                    ProjectService.create(res).then(function(result) {
                        delete $scope.local.createProject;
                    })
                } else {
                    delete $scope.local.createProject;
                }
            }, function(err) {}, function(msg) {});
        };
    }
]);
