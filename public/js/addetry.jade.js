var con_succeed = -1,//check connection for datasets
    related_ds = -1;//check whether a related dataset of a vis is form this portal
$(document).ready(function () {
    'use strict';


    if (-1 !== window.location.pathname.indexOf('/visualisation')) {
        con_succeed = 1;//no connection test for vis
    } else {
        related_ds = 1;
    }

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

    $('#dsTils').autocomplete({
        change: function (event, ui) {
            if (ui.item) {
                related_ds = 1;
            }
        },
        source: '/nametags/dataset'
    });

    $('#submit').bind('click', function (event) {
        if (con_succeed === -1)
            contest();
        if (-1 === con_succeed) {
            return alert('Please check the url of your entry');
        }

        if (-1 === related_ds) {
            return alert('Please select a dataset from the portal');
        }
        $('#adddata').submit();
        event.preventDefault();
    });

    $('#dbtest').bind('click', function (event) {
        event.preventDefault();
        contest();
    });

    function contest() {
        console.log('contest');
        var protocol = {
            sparql: 'http',
            hive: 'http',
            mongodb: 'mongodb',
            mysql: 'mysql',
            postgres: 'postgres'
        };
        var data = {};
        $('#conted').removeClass('glyphicon-remove glyphicon-ok');
        data.typ = $('#adddata select[name=querytype]').val().toLowerCase();
        data.url = $('#adddata input[name=url]').val();
        if (-1 === data.url.indexOf('://') && 'mysql' !== data.typ) {
            data.url = protocol[data.typ] + '://' + data.url;
            $('#adddata input[name=url]').val(data.url);
        }
        data.user = $('#adddata input[name=user]').val();
        data.pwd = $('#adddata input[name=pwd]').val();
        $.get('/contest?url=' + data.url + '&typ=' + data.typ + '&user=' + data.user + '&pwd=' + data.pwd, function (data, textStatus) {
            console.log(data);
            if (data) {
                $('#conted').addClass('glyphicon-remove');
                con_succeed = false;
                return false;
            } else {
                $('#conted').addClass('glyphicon-ok');
                con_succeed = true;
                return true;
            }
        });
    }

    //validation
    $('#adddata').bootstrapValidator({
        live: 'enabled',
        message: 'This value is not valid',
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            name: {
                message: 'The tile is not valid',
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
            }
        }
    });
//file uploading
//    $(':file').change(function(){
//        var file = this.files[0];
//        var name = file.name;
//        var size = file.size;
//        var type = file.type;
//    });

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
            con_succeed = 1;
            alert('File uploaded');
            var path = data.path;
            $("#adddata input[name='url']").val(path);
        } else {
            con_succeed = -1;
            alert('File uploading failed.')
        }
    }

    function errorHandler() {
        con_succeed = -1;
        alert('File uploading failed');
    }
})
;
