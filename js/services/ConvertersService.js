angular.module($APP.name).factory('ConvertersService', ConvertersService)

ConvertersService.$inject = ['$http']

function ConvertersService($http) {
    var service = {
        init_defect: init_defect,
        save_defect: save_defect,
        save_local: save_local
    }
    return service;

    function init_defect(data) {
        data.status_obj = {
            id: data.status_id,
            name: data.status_name
        };
        data.severity_obj = {
            id: data.severity_id,
            name: data.severity_name
        };
        data.priority_obj = {
            id: data.priority_id,
            name: data.priority_name
        };
        return data;
    }

    function save_defect(data) {
        data.status_id = data.status_obj.id
        data.status_name = data.status_obj.name
        data.severity_id = data.severity_obj.id
        data.severity_name = data.severity_obj.name
        data.priority_id = data.priority_obj.id
        data.priority_name = data.priority_obj.name
        return data;
    }

    function save_local(drawing) {
        return {
            "base64String": drawing.base64String,
            "closed_out_defects": drawing.closed_out_defects,
            "completed_defects": drawing.completed_defects,
            "contested_defects": drawing.contested_defects,
            "delayed_defects": drawing.delayed_defects,
            "incomplete_defects": drawing.incomplete_defects,
            "partially_completed_defects": drawing.partially_completed_defects,
            "code": drawing.code,
            "drawing_date": drawing.drawing_date,
            "file_name": drawing.file_name,
            "id": drawing.id,
            "nr_of_defects": drawing.nr_of_defects,
            "pdfPath": drawing.pdfPath,
            "project_id": drawing.project_id,
            "resized_path": drawing.resized_path,
            "revision": drawing.revision,
            "title": drawing.title,
            "relatedDefects": drawing.relatedDefects,
            "markers": []
        };
    }

};
