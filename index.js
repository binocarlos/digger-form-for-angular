var templates = {
  form:require('./form'),
  field:require('./field'),
  list:require('./list'),
  fieldrender:require('./fieldrender')
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
      controller:function($scope){

      },
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

  .factory('$digger_fields', function($safeApply){

    return [{
      name:'_digger.tag',
      title:'<tag>'
    },{
      name:'_digger.class',
      type:'diggerclass',
      title:'.class'
    },{
      name:'_digger.id',
      title:'#id'
    },{
      name:'_digger.icon',
      type:'diggericon',
      title:'icon'
    }]

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
      diggericon:true,
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


  .directive('diggerFieldRender', function($compile, $diggerFieldTypes){


    return {
      restrict:'EA',
      scope:{
        field:'=',
        container:'=', 
        model:'=',
        fieldname:'=',
        readonly:'='
      },
      replace:true,
      template:templates.fieldrender,
      controller:function($scope){

        $scope.$watch('container', function(){
          $scope.setup_render_type();
        })

        $scope.$watch('field', function(){
          $scope.setup_render_type();
        })

        /*
        
          sort out the values for the field to render

          we check if we are rendering a template or component
          
        */
        $scope.setup_render_type = function(){

          if(!$scope.container){
            return;
          }
          if(!$scope.field){
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

            if($diggerFieldTypes.types[$scope.field.type]){
              var info = $diggerFieldTypes.types[$scope.field.type];

              if(typeof(info)==='string'){
                fieldtype = info;
              }
              else{
                fieldtype = $scope.field.type;
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
          
      }
    }
  })

  .directive('diggerListRender', function($safeApply){
    function littleid(chars){

      chars = chars || 6;

      var pattern = '';

      for(var i=0; i<chars; i++){
        pattern += 'x';
      }
      
      return pattern.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }

    return {
      restrict:'EA',
      scope:{
        field:'=',
        container:'=', 
        model:'=',
        fieldname:'=',
        readonly:'='
      },
      replace:true,
      template:templates.list,
      controller:function($scope){

        $scope.$watch('model', function(model){
          if(!model){
            return;
          }

          if(!$scope.model[$scope.fieldname]){
            $scope.model[$scope.fieldname] = [];
          }
          $scope.list = $scope.model[$scope.fieldname].map(function(item){
            return {
              value:item
            }
          })
          $scope.usefieldname = 'value';
        })

        $scope.$watch('list', function(list){
          $scope.model[$scope.fieldname] = list.map(function(item){
            return item.value;
          })
        }, true);

        $scope.addrow = function(){
          $scope.list.push({
            value:null
          })
        }

        $scope.deleterow = function(index){
          $scope.list.splice(index,1);
        }

        $scope.moverow = function(old_index, dir){

          var new_index = old_index + dir;
          if (new_index >= $scope.list.length) {
              var k = new_index - $scope.list.length;
              while ((k--) + 1) {
                  $scope.list.push(undefined);
              }
          }
          $scope.list.splice(new_index, 0, $scope.list.splice(old_index, 1)[0]);



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
        listindex:'=',
        fieldclass:'=',
        globalreadonly:'=readonly'
      },
      replace:true,
      template:templates.field,
      controller:function($scope){

        function setupreadonly(){
          if(!$scope.container){
            return;
          }
          $scope.readonly = $scope.globalreadonly || ($scope.field.type==='readonly' || $scope.field.readonly || $scope.container.data('readonly'));
        }
        
        $scope.$watch('globalreadonly', function(globalreadonly){
          
          setupreadonly();

          //$scope.parentreadonly = globalreadonly;
          //setupreadonly();
        })

        $scope.fieldname = '';
        $scope.rendertype = 'text';

        if(typeof($scope.field.required)=='string'){
          $scope.field.required = eval($scope.field.required);
        }

        $scope.setup = function(){
          $scope.setup_field_and_model();
          setupreadonly();
        }

        /*
        
          get the containing model for the field - this might be nested in the container
          
        */
        $scope.setup_field_and_model = function(){

          if(!$scope.container){
            return;
          }
          if(!$scope.field){
            return;
          }

          var parsedmodel = $propertyModel($scope.container, $scope.field.name);

          $scope.fieldname = parsedmodel.fieldname;
          $scope.model = parsedmodel.model;

          if($scope.field.list && !$scope.model[$scope.field.name]){
            $scope.model[$scope.field.name] = [];
          }

        }


      },
      link:function($scope, elem, $attrs){

        $scope.$watch('container', function(){
          $scope.setup();
        })

        $scope.$watch('field', function(){
          $scope.setup();
        })

          
      }

    }
  })