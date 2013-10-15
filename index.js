var templates = {
  form:require('./form'),
  field:require('./field')
}

angular
  .module('digger.form', [
    
  ])

  .filter('fieldtitle', function(){
    return function(title){
      return (title || '').replace(/_/g, ' ');
    }
  })

  .directive('diggerForm', function(){


    //field.required && showvalidate && containerForm[field.name].$invalid
    return {
      restrict:'EA',
      scope:{
        fields:'=',
        container:'=',
        fieldclass:'@',
        readonly:'@',
        showedit:'='
      },
      transclude:true,
      replace:true,
      template:templates.form,
      link:function($scope, elem, $attrs){

      }
    }
  })

  .directive('diggerClassField', function($compile, $safeApply){
    return {
      restrict:'A',
      link:function($scope){

        function getstring(){

          return (($scope.model ? $scope.model[$scope.fieldname] : []) || []).join(', ');
        }

        function setstring(st){
          if(!$scope.model){
            return;
          }
          var parts = (st.split(',') || []).map(function(s){
            return s.replace(/^\s+/, '').replace(/\s+$/, '');
          })

          $scope.model[$scope.fieldname] = parts;
          //$safeApply($scope, function(){});
        }

        $scope.classval = getstring();
        $scope.$watch('classval', setstring);
        $scope.$watch('model', function(){
          $scope.classval = getstring();
        });

        
      }
    }
  })


  .factory('$diggerFieldTypes', function(){

    /*
    
      the field types that we have in our core template

      the user can also use templates and components
      
    */
    var fieldtypes = {
      text:true,
      url:true,
      number:true,
      money:'number',
      email:true,
      textarea:true,
      diggerclass:true,
      template:true,
      checkbox:true,
      radio:true,
      select:true
    }

    return {
      types:fieldtypes
    }
  })

  /*
  
    extracts the JS object that contains the target field - this becomes the model for the form field

    e.g. field = 'city.address'

    container.get(0).city

    -> 

    model = {
      address:'hello'
    }


    
  */
  .factory('$propertyModel', function(){
    return function(container, fieldname){
      if(fieldname.indexOf('.')>0){
        var parts = fieldname.split('.');
        var fieldname = parts.pop();
        var basename = parts.join('.');

        return {
          fieldname:fieldname,
          model:container.attr(basename)
        }
      }
      else{
        return {
          fieldname:fieldname,
          model:container.get(0)
        }
      }
    }
  })

  .directive('diggerField', function($compile, $safeApply, $propertyModel, $diggerFieldTypes){

    //field.required && showvalidate && containerForm[field.name].$invalid


    return {
      restrict:'EA',
      scope:{
        field:'=',
        container:'=',
        fieldclass:'=',
        globalreadonly:'=readonly'
      },
      replace:true,
      template:templates.field,
      controller:function($scope){

        $scope.parentreadonly = ($scope.globalreadonly || '').indexOf('y')==0;
        $scope.fieldname = '';
        $scope.rendertype = 'text';

        if(typeof($scope.field.required)=='string'){
          $scope.field.required = eval($scope.field.required);
        }

        $scope.setup = function(){
          $scope.setup_field_and_model();
          $scope.setup_render_type();
        }

        /*
        
          get the containing model for the field - this might be nested in the container
          
        */
        $scope.setup_field_and_model = function(){

          if(!$scope.container){
            return;
          }

          var parsedmodel = $propertyModel($scope.container, $scope.field.name);

          $scope.fieldname = parsedmodel.fieldname;
          $scope.model = parsedmodel.model;
          
        }

        /*
        
          sort out the values for the field to render

          we check if we are rendering a template or component
          
        */
        $scope.setup_render_type = function(){

          if(!$scope.container){
            return;
          }

          /*
          
            a manual regexp given by the blueprint
            
          */
          var pattern = $scope.field.pattern || '';

          if(pattern.length<=0){
            $scope.pattern = /./;
          }
          else{
            $scope.pattern = new RegExp(pattern);
          }

          /*
          
            options
            
          */
          // the options are supplied as an array extracted from the field's option children (inside the blueprint XML / container)
          if($scope.field.options){
            $scope.options = $scope.field.options;
          }
          // the options are supplied as csv
          else if($scope.field.options_csv){
            $scope.options = ($scope.field.options_csv.split(/,/) || []).map(function(option){
              return option.replace(/^\s+/, '').replace(/\s+$/, '');
            })
          }
          // read the options list from digger
          else if($scope.field.options_warehouse){
            var warehouse = $digger.connect($scope.field.options_warehouse);

            warehouse($scope.field.options_selector).ship(function(results){
              $safeApply($scope, function(){
                $scope.options = results.map(function(result){
                  return result.title();
                })
              })
            })
          }

          /*
          
            if they have registered a custom template then use that!
            
          */
          var template = $digger.template.get($scope.field.type);

          $scope.readonly = $scope.parentreadonly || ($scope.field.type==='readonly' || $scope.field.readonly || $scope.container.data('readonly'));

          /*
            
            TEMPLATE

            manual templates on page
            
          */          
          if(template){
            $scope.fieldtype = 'template';
            $scope.rendertemplate = template;
          }
          /*
          
            COMPONENT

            any field type with '/' means it is a component living on github
            
          */
          else if(($scope.field.type || '').match(/\//)){
            $scope.fieldtype = 'component';
          }
          /*
          
            DIGGER FIELD

            standard digger fields
            
          */
          else{

            var fieldtype = 'text';

            if($diggerFieldTypes[$scope.field.type]){
              var info = $diggerFieldTypes[$scope.field.type];

              if(typeof(info)==='string'){
                fieldtype = info;
              }
            }

            $scope.fieldtype = fieldtype;//fieldtypes[$scope.field.type] ? $scope.field.type : 'text';
          }

          $scope.field.usetitle = $scope.field.title ? $scope.field.title : ($scope.field.name.split('.').pop());
        }

      },
      link:function($scope, elem, $attrs){

        $scope.$watch('rendertemplate', function(html){

          if(!html){
            return;
          }

          elem.append($compile(html)($scope));
        })

        $scope.$watch('container', function(){
          $scope.setup();
        })

        $scope.$watch('field', function(){
          $scope.setup();
        })

          
      }

    }
  })