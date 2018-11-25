var app = angular.module( `appAddRestaurant`, [] )
    .controller( `ctrlAddRestaurant`, function($scope, $http) {
        
        $scope.submitFrmAddRestaurant = function(e) {        
            // var frmAddRestaurant = document.forms[`frmAddRestaurant`];
            var newRestaurant = $scope.newRestaurant;
            console.log( newRestaurant );            
                            
            var settings = {
                "async": true,
                "crossDomain": true,
                "url": "/restaurant",
                "method": "POST",
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "cache-control": "no-cache",
                    "Postman-Token": "c26b3995-46ff-4a5e-b375-fb4108f2cd0b"
                },
                "data": newRestaurant,
                "success": function( response ) {
                    console.log(response);                    
                },
                "error": function( response ) {
                    var responseObj = JSON.parse( response.responseText );   
                    
                    if( responseObj.errors ) {
                        $scope.logErrors( responseObj.errors );
                    }
                }
            };
            
            $.ajax(settings);
        };

        $scope.logErrors = function( errors ) {
            errors.forEach( error => {
                console.log(error);                
            });
        };

    } );