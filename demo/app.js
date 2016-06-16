(function (angular) {
    angular
        .module('jpicturaDemoApp', ['ngMaterial', 'ngAnimate', 'ngMessages'])
        .controller('MainController', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {
            var vm = this;

            vm.toggleControlPanel = toggleControlPanel;

            vm.codePreview = {
                js: ''
            };
            vm.showCodePreview = false;
            vm.toggleCodePreview = toggleCodePreview;

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

                refresh();
            });

            $scope.$watch('vm.selectedPreset', function (oldValue, newValue) {
                if (vm.selectedPreset.settings !== null) {
                    vm.settings = angular.copy(vm.selectedPreset.settings);
                }
            });

            $scope.$watch('vm.settings', function (oldValue, newValue) {
                if (vm.selectedPreset.settings !== null && !angular.equals(vm.settings, vm.selectedPreset.settings)) {
                    vm.selectedPreset = vm.presets[0];
                }

                refresh();
            }, true);

            function isGallerySelected(id) {
                var result = false;

                vm.galleries.forEach(function (gallery) {
                    if (gallery.id === id && gallery.selected) {
                        result = true;
                    }
                });

                return result;
            }

            function refresh() {
                rebuildGallery();
                updateCodePreview();
            }

            function rebuildGallery() {
                $('.gallery').jpictura(vm.settings);
            }

            function updateCodePreview() {
                var settings = getObjectDifferences($.fn.jpictura.defaults, vm.settings);
                var settingsString = Object.keys(settings).length > 0 ? angular.toJson(settings, true) : '';
                vm.codePreview.js = "$('.gallery').jpictura(" + settingsString + ");";
                hljs.highlightBlock($('pre code'));
            }

            function getObjectDifferences(obj1, obj2) {
                var differences = {};

                for (var i in obj1) {
                    if (typeof (obj1[i]) === 'object') {
                        var diff = getObjectDifferences(obj1[i], obj2[i]);
                        if (Object.keys(diff).length) {
                            differences[i] = diff;
                        }
                    } else {
                        if (!angular.equals(obj1[i], obj2[i])) {
                            differences[i] = obj2[i];
                        }
                    }
                }

                return differences;
            }

            function toggleControlPanel() {
                $mdSidenav('left').toggle();
            }

            function toggleCodePreview() {
                vm.showCodePreview = !vm.showCodePreview;
            }
        }])
        .config(['$mdThemingProvider', function ($mdThemingProvider) {
            $mdThemingProvider
                .theme('docsDark')
                .primaryPalette('lime')
                .dark();
        }]);
})(angular, hljs);