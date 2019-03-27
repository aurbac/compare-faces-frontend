/**
 * @author Uriel Ramirez <aurbac@gmail.com>
 */

var sourceUploadPreSignedUrl = "";
var targetUploadPreSignedUrl = "";
var sourceDownloadPreSignedUrl = "";
var targetDownloadPreSignedUrl = "";
var sourceUploaded = false;
var targetUploaded = false;
var step = 0;
var id_image = randomString(10);
var key_image_source = 'images/'+id_image+'-source.jpg';
var key_image_target = 'images/'+id_image+'-target.jpg';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: albumBucketName }
});

var source_params = {
  Bucket: albumBucketName,
  Key: key_image_source,
  ACL: 'authenticated-read',
  ContentType: 'binary/octet-stream',
};
var target_params = {
  Bucket: albumBucketName,
  Key: key_image_target,
  ACL: 'authenticated-read',
  ContentType: 'binary/octet-stream',
};

s3.getSignedUrl('putObject', source_params, function (err, url) {
  sourceUploadPreSignedUrl = url;
  console.log('The URL is', url);
});

s3.getSignedUrl('putObject', target_params, function (err, url) {
  targetUploadPreSignedUrl = url;
  console.log('The URL is', url);
});

var source_params_down = {
  Bucket: albumBucketName,
  Key: key_image_source,
  ResponseContentType: 'image/jpeg'
};
var target_params_down = {
  Bucket: albumBucketName,
  Key: key_image_target,
  ResponseContentType: 'image/jpeg'
};

s3.getSignedUrl('getObject', source_params_down, function (err, url) {
  sourceDownloadPreSignedUrl = url;
  console.log('The download URL is', url);
});

s3.getSignedUrl('getObject', target_params_down, function (err, url) {
  targetDownloadPreSignedUrl = url;
  console.log('The download URL is', url);
});

$( document ).ready(function() {

  $( "#bt_ref" ).click(function(e) {
    e.preventDefault();
    console.log("Hola click");
    if($('#ref_box').is(':visible')){
      $( "#ref_box" ).fadeOut( "slow", function() {
        // Animation complete
      });
    }else{
      $( "#ref_box" ).fadeIn( "slow", function() {
        // Animation complete
      });
    }

  });


 $("#source_pic").change(function (){
   var fileName = $(this).val();
   console.log(sourceUploadPreSignedUrl)
   console.log(fileName);
   if (fileName!=""){
    $("#source_loading").show();
    step = 1;
    sendFile($(this),sourceUploadPreSignedUrl, sourceDownloadPreSignedUrl, $("#source_image_holder"), $("#source_loading"));
  }

});

 $("#target_pic").change(function (){
   var fileName = $(this).val();
   console.log(targetUploadPreSignedUrl)
   console.log(fileName);
   if (fileName!=""){
    $("#target_loading").show();
    step = 2;
    sendFile($(this),targetUploadPreSignedUrl, targetDownloadPreSignedUrl, $("#target_image_holder"), $("#target_loading"));
  }

});
 console.log( "ready!" );
});

function sendFile(file, uploadSignedUrl, downloadSignedUrl, image_holder, image_loading) {
  var theFormFile = file.get()[0].files[0];
  $.ajax({
    type: 'PUT',
    url: uploadSignedUrl,
    contentType: 'binary/octet-stream',
    processData: false,
    data: theFormFile
  })
  .done(function() {
    image_loading.hide();
    if (step==1)
      sourceUploaded = true;
    else if (step==2)
      targetUploaded = true;
    image_holder.attr('src',downloadSignedUrl+'&r='+randomString(10));
    if (sourceUploaded && targetUploaded){
      $("#result_box").show();
      getInformation();
    }
  })
  .fail(function() {
    image_loading.hide();
    alert('File NOT uploaded');
    console.log( arguments);
  });
  return false;
}

function getInformation(){
  $("#text_result").empty();
  $("#image_result").empty();
  $("#result_loading").show();
  $("html, body").animate({ scrollTop: $(document).height()-$(window).height() });
  data_obj = { id: id_image, key_image_source: key_image_source, key_image_target: key_image_target };
  $.post( url_api+"get-information", JSON.stringify(data_obj), function( data ) {
    console.log(data);
    $("#result_loading").hide();
    if (data['text_detections']!=null){
      for (var i = 0; i < data['text_detections'].length; i++) {
        console.log(data['text_detections'][i]);
        $("#text_result").append("<span class=\"badge badge-info\">"+data['text_detections'][i]+"</span> ")
      }
      $("html, body").animate({ scrollTop: $(document).height()-$(window).height() });
      $("#image_result").append("<img id=\"target_image_holder\" src=\""+url_api+"get-image-result/"+id_image+"?r="+randomString(10)+"\" class=\"img-fluid\">");
      $("html, body").animate({ scrollTop: $(document).height()-$(window).height() });
    }else{
      var message_result = "";
      if (data['face_in_source']==false && data['face_in_target']==false){
        message_result = "No faces were detected in source and target pictures! Please try with others.";
      }else if (data['face_in_source']==false){
        message_result = "No face was detected in source picture! Please try with another one.";
      }else{
        message_result = "No face was detected in target picture! Please try with another one.";
      }
      $("#text_result").append("<div class=\"alert alert-warning\" role=\"alert\">"+message_result+"</div>")
    }
  });
}

function randomString(len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz,randomPoz+1);
  }
  return randomString;
}
