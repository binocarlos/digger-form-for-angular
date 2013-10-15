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
    return {
      list:[
        'text',
        'textarea',
        'number',
        'email',
        'radio',
        'checkbox',
        'select'
      ],
      properties:{
        text:{},
        number:{},
        email:{},
        textarea:{},
        checkbox:{},
        file:{},
        radio:{
          options:true
        },
        select:{
          options:true
        }
      }
    }
  })

  /*
  
    extracts the JS object that contains the target field - this becomes the model for the form field
    
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

  .directive('diggerField', function($compile, $safeApply, $propertyModel){

    //field.required && showvalidate && containerForm[field.name].$invalid

    /*
    
      these are types that should be converted into the input type="..."
      
    */
    var fieldtypes = {
      text:true,
      number:true,
      email:true,
      textarea:true,
      diggerclass:true,
      template:true,
      checkbox:true,
      radio:true,
      select:true
    }

    var textrendertypes = {
      number:true,
      email:true
    }

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

        $scope.setup_field_and_model = function(){

          if(!$scope.container){
            return;
          }

          var parsedmodel = $propertyModel($scope.container, $scope.field.name);

          $scope.fieldname = parsedmodel.fieldname;
          $scope.model = parsedmodel.model;
          
        }

        $scope.setup_render_type = function(){

          if(!$scope.container){
            return;
          }

          
          var pattern = $scope.field.pattern || '';

          if(pattern.length<=0){
            $scope.pattern = /./;
          }
          else{
            $scope.pattern = new RegExp(pattern);
          }

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
                    
            manual templates on page
            
          */          
          if(template){
            $scope.fieldtype = 'template';
            $scope.rendertemplate = template;
          }
          /*
          
            any field type with '/' means it is a component living on github
            
          */
          else if(($scope.field.type || '').match(/\//)){
            $scope.fieldtype = 'component';
          }
          /*
          
            standard digger fields
            
          */
          else{
            $scope.fieldtype = fieldtypes[$scope.field.type] ? $scope.field.type : 'text';
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