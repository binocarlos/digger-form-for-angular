module.exports = ' \n  \n<div ng-form="diggerForm" class="form-horizontal">\n  <div class="form-group" ng-class="{error: haserror, \'has-error\':container.errors[field.name]}" ng-repeat="field in fields">\n    <label for="{{ field.name }}" class="col-sm-3 control-label">{{ field.usetitle | ucfirst }}</label>\n    <div class="col-sm-7">\n      <digger-field readonly="readonly" field="field" container="container" fieldclass="fieldclass" />\n    </div>\n    <div class="col-sm-2" ng-show="showedit">\n      <a href="#" class="btn btn-mini" ng-click="$emit(\'deletefield\', field)">\n          <i class="icon-trash"></i>\n      </a>\n      <a href="#" class="btn btn-mini" ng-click="$emit(\'editfield\', field)">\n          <i class="icon-edit"></i>\n      </a>\n    </div>\n  </div>\n  <div ng-transclude></div>\n</div>';