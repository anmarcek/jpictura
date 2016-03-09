(function (angular) {
    angular.module('jpicturaDemoApp', ['ngMaterial']).controller('MainController', ['$scope', '$mdSidenav', function ($scope, $mdSidenav) {
        var vm = this;

        vm.toggleControlPanel = toggleControlPanel;

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
            responsive: true,
            waitForImages: true,
            heightCalculator: jpictura.heightCalculator,
            algorithm: {
                epsilon: 0.01,
                maxIterationCount: 100
            },
            debug: false
        };

        $scope.$watch('vm.settings', function () {
            rebuildGallery();
        }, true);

        function rebuildGallery() {
            $('#gallery-a').jpictura(vm.settings);
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