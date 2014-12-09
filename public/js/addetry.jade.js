$(document).ready(function () {
    'use strict';

    var related_ds = -1;//check whether a related dataset of a vis is form this portal
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
        if ('file' === value) {
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
            file: {
                validators: {
                    file: {
                        maxSize: 20971520,   // 20MB
                        message: 'File size up to 20MB'
                    }
                }
            },
            basedOn: {
                threshold: 5,
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
        $('#adddata').bootstrapValidator('revalidateField', 'querytype');
    });

//file uploading
    $('#adddata select[name=querytype]').change(function () {
        var val = $(this).val();
        if ('file' === val.toLowerCase()) {
            $('#upload').fadeIn();
            $('#contest').fadeOut();
        }
        else {
            $('#contest').fadeIn();
            $('#upload').fadeOut();
        }
    });

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

    function beforeSendHandler() {
        $('.progress').removeClass('hidden');
    }

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
        console.log(status);
        console.log(data);
        if (status === 200) {
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
})
;
