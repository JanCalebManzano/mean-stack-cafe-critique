var myApp = angular.module('myApp', []);
myApp.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {
  console.log("Hello World from controller");

  $scope.add = function() {
    console.log($scope.restaurant);
    // $http.post('/restaurant', $scope.restaurant).success(function(response) {
    //   console.log(response);
    // });
  };

}]);