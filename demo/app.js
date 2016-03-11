(function (angular) {
    angular.module('jpicturaDemoApp', ['ngMaterial']).controller('MainController', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {
        var vm = this;

        vm.toggleControlPanel = toggleControlPanel;

        vm.galleries = [
            { id: 'gallery-number-pictures', name: 'Test schema (local)' },
            { id: 'gallery-real-pictures', name: 'Landscapes (local)' },
            { id: 'gallery-pictures-from-net', name: 'Flowers (net)' }
        ];
        vm.gallery = vm.galleries[0];

        var nameInLowerCase = 'jpictura';
        vm.settings = {
            selectors: {
                item: '.item',
                image: 'img'
            },
            classes: {
                container: nameInLowerCase,
                item: nameInLowerCase + '-item',
                image: nameInLowerCase + '-image',
                lastRow: nameInLowerCase + '-last-row',
                firstInRow: nameInLowerCase + '-first-in-row',
                lastInRow: nameInLowerCase + '-last-in-row',
                invisible: nameInLowerCase + '-invisible'
            },
            layout: {
                rowPadding: 0,
                applyRowPadding: true,
                itemSpacing: 5,
                applyItemSpacing: true,
                idealRowHeight: 180,
                minWidthHeightRatio: 1 / 3,
                maxWidthHeightRatio: 3,
                stretchImages: true,
                allowCropping: true,
                croppingEpsilon: 3,
                centerImages: true,
                justifyLastRow: false
            },
            effects: {
                fadeInItems: false
            },
            responsive: {
                enabled: true,
                onWindowWidthResize: true,
                onContainerWidthResize: false,
                debounce: 250
            },
            waitForImages: true,
            heightCalculator: jpictura.heightCalculator,
            algorithm: {
                epsilon: 0.01,
                maxIterationCount: 50
            },
            debug: true
        };

        rebuildGallery();

        $scope.$watch('vm.gallery', function (oldValue, newValue) {
            if (angular.equals(oldValue, newValue)) {
                return;
            }
            rebuildGallery();
        });
        $scope.$watch('vm.settings', function (oldValue, newValue) {
            if (angular.equals(oldValue, newValue)) {
                return;
            }
            rebuildGallery();
        }, true);

        function rebuildGallery() {
            $('#' + vm.gallery.id).jpictura(vm.settings);
        }

        function toggleControlPanel() {
            $mdSidenav('left').toggle();
        }
    }]).config(['$mdThemingProvider', function ($mdThemingProvider) {
        $mdThemingProvider.theme('docs-dark')
            .primaryPalette('blue')
            .dark();
    }]);
})(angular);