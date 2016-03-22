(function (angular) {
    angular
        .module('jpicturaDemoApp', ['ngMaterial', 'ngAnimate', 'ngMessages'])
        .controller('MainController', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {
            var vm = this;

            vm.toggleControlPanel = toggleControlPanel;

            vm.galleries = [
                { id: 'gallery-number-pictures', name: 'Test schema (local)', selected: true },
                { id: 'gallery-real-pictures', name: 'Landscapes (local)', selected: false },
                { id: 'gallery-pictures-from-net', name: 'Flowers (net)', selected: false }
            ];
            vm.isGallerySelected = isGallerySelected;

            var presets = {};
            presets.defaultSettings = $.fn.jpictura.defaults;
            presets.noSpacing = angular.merge({}, presets.defaultSettings, {
                layout: {
                    itemSpacing: 0
                }
            });

            vm.presets = [
                { id: 'custom', name: 'Custom settings', settings: null },
                { id: 'default-settings', name: 'Default settings', settings: presets.defaultSettings },
                { id: 'no-spacing', name: 'No spacing', settings: presets.noSpacing }
            ];
            vm.selectedPreset = vm.presets[1];

            $scope.$watch('vm.galleries', function (oldValue, newValue) {
                if (angular.equals(oldValue, newValue)) {
                    return;
                }

                rebuildGallery();
            });

            $scope.$watch('vm.selectedPreset', function (oldValue, newValue) {
                if (vm.selectedPreset.settings !== null) {
                    vm.settings = angular.copy(vm.selectedPreset.settings);
                }
            });

            $scope.$watch('vm.settings', function (oldValue, newValue) {
                if (angular.equals(oldValue, newValue)) {
                    return;
                }

                if (vm.selectedPreset.settings !== null && !angular.equals(vm.settings, vm.selectedPreset.settings)) {
                    vm.selectedPreset = vm.presets[0];
                }

                rebuildGallery();
            }, true);

            rebuildGallery();

            function isGallerySelected(id) {
                var result = false;

                vm.galleries.forEach(function (gallery) {
                    if (gallery.id === id && gallery.selected) {
                        result = true;
                    }
                });

                return result;
            }

            function rebuildGallery() {
                $('.gallery').jpictura(vm.settings);
            }

            function toggleControlPanel() {
                $mdSidenav('left').toggle();
            }
        }])
        .config(['$mdThemingProvider', function ($mdThemingProvider) {
            $mdThemingProvider
                .theme('docs-dark')
                .primaryPalette('lime')
                .dark();
        }]);
})(angular);