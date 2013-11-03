module.exports = ' \n<div ng-form="diggerForm" class="form-horizontal">\n  <div class="form-group" ng-repeat="field in fields" ng-class="{\'has-error\': container.data(\'error.\' + field.name)}">\n    <label for="{{ field.name }}" class="control-label col-lg-4">{{ field.usetitle | fieldtitle | ucfirst }}</label>\n    <div class="col-lg-7">\n      <digger-field readonly="readonly" field="field" container="container" fieldclass="fieldclass" />\n    </div>\n    \n    <div class="col-sm-1" ng-show="showedit">\n      <a href="#" class="btn btn-sm btn-warning" ng-click="$emit(\'deletefield\', field)">\n          <i class="fa fa-trash-o"></i>\n      </a>\n    </div>\n    \n  </div>\n  <div ng-transclude></div>\n</div>';