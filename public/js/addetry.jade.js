$(document).ready(function () {
    'use strict';

    var related_ds = -1;//check whether a related dataset of a vis is form this portal
    var imported = false;//whether is dataset is imported from another site
    //animations
    $('#private').bind('click', function () {
        var $this = $(this);
        // $this will contain a reference to the checkbox   
        if ($this.prop('checked')) {
            // the checkbox was checked 
            $('#visible').fadeIn();
        }

        if (!$this.prop('checked')) {
            $('#visible').fadeOut();
            $('#visible input').prop('checked', false);
        }
    });


    $('#optogl').bind('click', function () {
        $('#optogl span').toggleClass('glyphicon-chevron-down glyphicon-chevron-up');
    });

    //auto complete
    $('#dsTils').autocomplete({
        change: function (event, ui) {
            if (ui.item) {
                related_ds = 1;
            } else {
                related_ds = -1;
            }
        },
        source: '/nametags/dataset'
    });

    //dataset connection validator
    function contest(value) {
        var data = {}, msg;

        data.typ = value.toLowerCase();
        if ('imported' === value || 'file' === value) {
            return true;
        }

        data.url = $('#adddata input[name=url]').val();
        /*if (-1 === data.url.indexOf('://') && 'mysql' !== data.typ) {
         data.url = protocol[data.typ] + '://' + data.url;
         $('#adddata input[name=url]').val(data.url);
         }*/
        data.user = $('#adddata input[name=user]').val();
        data.pwd = $('#adddata input[name=pwd]').val();

        $.ajax({
            url: '/contest?url=' + data.url + '&typ=' + data.typ + '&user=' + data.user + '&pwd=' + data.pwd,
            success: function (data) {
                msg = data;
            },
            async: false
        });

        if (msg) {
            console.log(msg);
        }
        return {
            valid: msg === null,
            message: msg
        };
    }

    //validation
    $('#adddata').bootstrapValidator({
        container: 'popover',
        live: 'enabled',
        message: 'This value is not valid',
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        threshold: 3,
        fields: {
            name: {
                validators: {
                    notEmpty: {
                        message: 'The title is required and cannot be empty'
                    }
                }
            },
            url: {
                validators: {

                    notEmpty: {
                        message: 'The url is required and cannot be empty'
                    }
                }
            },
            des: {
                validators: {
                    stringLength: {
                        message: 'Description must be more than 100 characters',
                        min: 100
                    }
                }
            },
            file: {
                validators: {
                    file: {
                        maxSize: 10485760,   // 10MB
                        message: 'File size up to 10MB'
                    }
                }
            },
            basedOn: {
                threshold: 3,
                validators: {
                    callback: {
                        enabled: 'visualisation' === type,
                        message: 'You must select a dataset listed in the portal',
                        callback: function (value, validator, $field) {
                            return 1 === related_ds;
                        }
                    }
                }
            },
            querytype: {
                validators: {
                    callback: {
                        enabled: 'dataset' === type,
                        message: 'Please check the url and username/password your provided for the dataset',
                        callback: contest
                    }
                }
            },
            git: {
                validators: {
                    callback: {
                        enabled: 'visualisation' === type,
                        message: 'Invalid Github address',
                        callback: function (value, validator) {
                            var valid = false;
                            if (-1 !== value.indexOf('https://github.com/')) {
                                valid = true;
                            }
                            /*                            $.ajax({
                             url: value,
                             success: function (data, status) {
                             stat = status;
                             valid = true;
                             },
                             error: function (jxr, status) {
                             stat = status;
                             valid = false;
                             },
                             async: false
                             });*/

                            if (valid) {
                                if (!validator.getFieldElements('url').val()) {
                                    validator.updateStatus('url', 'VALID');
                                }
                            }

                            return valid;
                        }
                    }
                }
            }
        }
    })
        .on('success.field.bv', function (e, data) {
            data.bv.disableSubmitButtons(false);
        })
        .on('error.field.bv', function (e, data) {
            // $(e.target)  --> The field element
            // data.bv      --> The BootstrapValidator instance
            // data.field   --> The field name
            // data.element --> The field element

            data.bv.disableSubmitButtons(false);
        });

    $('#adddata button[type=submit]').click(function () {
        //if (imported) {
        //    $('<input />').attr('type', 'hidden')
        //        .attr('name', "imported")
        //        .attr('value', true)
        //        .appendTo('#adddata');
        //}
        $('#adddata').bootstrapValidator('revalidateField', 'querytype');
    });

    //file uploading handling
    //show/hide file uploading input
    $('#adddata select[name=querytype]').change(function () {
        var val = $(this).val();
        if (val && 'file' === val.toLowerCase()) {
            $('#upload').fadeIn();
            $('.dsfields').fadeOut();
        }
        else {
            $('.dsfields').fadeIn();
            $('#upload').fadeOut();
        }
    });

    //file uploading 
    $('#upload button').click(function (event) {
        event.preventDefault();
        var formData = new FormData($('form')[0]);
        $.ajax({
            url: '/upload',  //Server script to process data
            type: 'POST',
            xhr: function () {  // Custom XMLHttpRequest
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) { // Check if upload property exists
                    myXhr.upload.addEventListener('progress', progressHandlingFunction, false); // For handling the progress of the upload
                }
                return myXhr;
            },
            //Ajax events
            beforeSend: beforeSendHandler,
            success: completeHandler,
            error: errorHandler,
            // Form data
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });
    });

    //zip file uploading 
    $('#uploadzip button').click(function (event) {
        event.preventDefault();
        var formData = new FormData($('form')[0]);
        $.ajax({
            url: '/uploadzip',  //Server script to process data
            type: 'POST',
            xhr: function () {  // Custom XMLHttpRequest
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) { // Check if upload property exists
                    myXhr.upload.addEventListener('progress', progressHandlingFunction, false); // For handling the progress of the upload
                }
                return myXhr;
            },
            //Ajax events
            beforeSend: beforeSendHandler,
            success: completeHandler,
            error: errorHandler,
            // Form data
            data: formData,
            //Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });
    });







    //show progress bar
    function beforeSendHandler() {
        $('.progress').removeClass('hidden');
    }

    //uploading progress
    function progressHandlingFunction(e) {
        if (e.lengthComputable) {
            var ratio = Math.round(e.loaded * 10000 / e.total) / 100 + '%';
            $('.progress-bar').css('width', ratio).attr({
                'aria-valuenow': e.loaded,
                'aria-valuemax': e.total
            }).text(ratio);
        }
    }

    function completeHandler(data, status) {
        if (status === 'success') {
            alert('File uploaded');
            var path = data.path;
            $("#adddata input[name='url']").val(path);
        } else {
            alert('File uploading failed.');
        }
    }

    function errorHandler() {
        alert('File uploading failed');
    }

    //importing from ckan
    $('#import').click(function (e) {
        e.preventDefault();
        ckanImport(function () {
            $('#adddata').bootstrapValidator('validate');
        });
    });

    //rdf.setPrefix('dcat','http://www.w3.org/ns/dcat#');
    //rdf.setPrefix('dct','http://purl.org/dc/terms/');
    //rdf.setPrefix('foaf','http://xmlns.com/foaf/0.1/');
    function ckanImport(cb) {
        var url = $('#ckan').val().trim();
        if (!url) {
            return;
        }

        if (-1 === url.indexOf('.rdf')) {
            url += '.rdf';
        }

        $('#adddata select[name=querytype]').replaceWith('<p name=querytype class="input-xlarge form-control-static" value="Imported">HTML</p>');

        rdf.defaultRequest('get', url,
            {}, null, function (status, header, data) {
                rdf.parseRdfXml(data, function (graph) {
                    var jsonG = rdf.serializeJsonLd(graph)[0];
                    var title = jsonG["http://purl.org/dc/terms/title"],
                        des = jsonG["http://purl.org/dc/terms/description"],
                        keyword = jsonG["http://www.w3.org/ns/dcat#keyword"].join(','),
                        url = jsonG["@id"];
                    $('#adddata input[name=name]').val(title);
                    $('#adddata input[name=url]').val(url);
                    $('#adddata textarea[name=des]').val(des);
                    $('#adddata textarea[name=kw]').val(keyword);
                    cb();
                });
            });
    }
});
