// dash.js - 6/25/2013 by Matthew Schmitz
//
// dash.js - a Web-UI 'dashboard' for monitoring the components that
//              Orbitty uses to provision video content.

// Global Variables

//var baseUri = "http://10.76.61.73:8080/ec/ncf/event/";
//var baseVideoUri = "http://10.76.61.73:8080/playvideo/ncf/event/";
var api = "http://api.cert.corp.espn.pvt";
//var api = "";
var baseUri = api + "/ec/ncf/event/";
var baseVideoUri = api + "/playvideo/ncf/event/";

var masheryUri = "http://api.espn.com/v1/sports/football/college-football/events/";
var apiKey = "_____";

//var thisBase = "http://localhost:3000";
var gamesData = {};

var defaultEmail = '<a href="mailto:matthew.s.schmitz@espn.com">matthew.s.schmitz@espn.com</a>';
var defaultErrorMsg = 'There was an error pulling the data. Please try again later. If the problem persists contact ' + defaultEmail;


// TODO have prod and deve versions of host URL
var hostUrl =  'http://cert.corp.espn.pvt/index.html';

var expanded = false;


// Determine Which Video Was First
function sortVideos(videos){
    var sortedList = new Array();
    var dates = new Array();
    var oldDates = new Array(); // ensure it is not referencing the same variable
    // TODO fix bad data offset hotfix
    var outlier = 1444239058000;
    var offset = 1;
    $.each(videos, function (k, vid) {
        var videoDate =  new Date(vid.publishedDate).getTime();
        // TODO fix bad data offset hotfix
        if (videoDate == 0){
            videoDate = outlier + offset;
            offset ++;
        }
        dates.push(videoDate);
        oldDates.push(videoDate);
    });
    var sortedDates = dates.sort(function(a,b){return a-b});
    //var usedClips = new Array(); // Ensures two clips with identical timestamps are not used.
    var dupCheck = false;
    var order = 0;
    $.each(sortedDates, function (k, d) {
        var dateIndex = oldDates.indexOf(d);
        //TODO DUPLICATE CHECK
        if (dateIndex != oldDates.lastIndexOf(d)){
            if (dupCheck){
                dateIndex = oldDates.lastIndexOf(d);
                //window.alert("dup difference resolved");
                dupCheck = false;
            }
            else{
                //window.alert("dup difference found");
                dupCheck = true;
            }
        }
        var videoCopy = videos[dateIndex];
        sortedList[order] = videoCopy;
        order ++;
    });
    return sortedList;
};

// Load Video on Click
function changeSource(domElm, mp4url){
    domElm.src = mp4url;
    domElm.load();
    domElm.click();
    domElm.onclick="";
};

// Methods for Clearing/Displaying Tool Alerts
function displayMessage(tool_name, msg, type) {
    var tool = '#' + tool_name  + 'Alert';
    jQuery(tool).html('');
    var cls = "error";
    if (typeof type != undefined || type != null || type != "") {
        if (type == "warning") {
            cls = "";
        }
        else {
            cls = "alert-"+type;
        }
    }
    message = $("<div />", {
        "class":"alert " + cls
    }).append($("<a/>", {
            href:"#",
            "data-dismiss": "alert",
            "class":"close",
            html:"X"
        })).append(msg).appendTo(tool);
    message.alert();
};

function clearMessage(tool_name) {
    var tool = '#' + tool_name  + 'Alert';
    jQuery(tool).html('');
};

// Method for setting focus to a tool (fixed position)
function focusTool(tool_name){
    var displayTop = $("#" + tool_name).position().top - 100;
    $("html, body").animate({scrollTop:displayTop}, 'fast');
};

// Login Function
// cookie information
function checkLoginStatus(){
    console.log("checkLoginStatus");
    if (isLoggedIn() == true){
        //console.log("isLoggedIn");
        $('#divLogin').hide();
        $('#btnUserInfo').html(getCookie("username"));
        $('#divLogout').show();
        $('#feedbackLink').show();
        return false;
    }
    else {
        //console.log("no one is logged in");
    }
};

function setCookie(c_name,value,exdays){
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
};

function getCookie(c_name){
    var i,x,y,ARRcookies=document.cookie.split(";");
    for (i=0;i<ARRcookies.length;i++)
    {
        x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
        y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==c_name)
        {
            return unescape(y);
        }
    }
};

function delCookie(c_name){
    document.cookie = c_name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

function validateUname(uname) {
    //var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (uname == "jen" || uname == "admin"){
        return true;
    }
    //return re.test(email);
};

function validatePword(pword) {
    if (pword.length >= 6){
        return true;
    }
    else
    {
        return false;
    }
};

function validateCreds(uname, pword) {
    var valid = false;
    if (uname == "jen" && pword == 'espn123'){
        valid = true;
    }
    if (uname == "admin" && pword == 'espn123'){
        valid = true;
    }
    return valid;
};

function isLoggedIn(){
    //console.log("function isLoggedIn");
    var username = getCookie("username");
    if (username!=null && username!="")
    {
        return true;
    }
    else{
        return false;
    }
};

// Gather Page Views for Refersh
function gatherViews(){
    console.log("gatherViews");
    /*console.log($("#searchId").html());
    console.log($("#eventViewerId").html());
    console.log($("#reportId").html());*/
    var event_id= $("#eventViewerEventId").html();
    var play_id= $("#eventViewerPlayId").html();
    //console.log(event_id  + " | " + play_id);
    loadEvent(event_id, play_id);
};

function manualRefresh(){
    console.log("invoke commands");
    gatherViews();
};

// Generate Handlers for Loading an event's Event Viewer
function generateHandlers(events){
    $.each(events, function (k, id) {
        var btnId = "btnEvent_" + id;
        $("#"+btnId).click(function() {
            loadEvent(id);
        });
    });
};

// Generate Event View Handlers for Loading an event's Event Viewer
function generateEventViewHandlers(events){
    $.each(events, function (k, id) {
        var btnId = "btnViewEvent_" + id;
        $("#"+btnId).click(function() {
            //var hostUrl =  'http://10.74.187.100:' + location.port +  window.location.pathname;
            //var eventUrl = hostUrl + '?eventId=' + id;
            loadEvent(id);
        });
    });
};

// Generate Handlers for Loading an collapsing a Play
function generatePlayHandlers(plays){
    $.each(plays, function (k, id) {
        var btnId = "btnExpand_" + id;
        var gridId = "divGrid_" + id;
        /*
        var currHtml = $("#event_viewer_results").html();
        var found  = (currHtml.indexOf(btnId) != -1);
        console.log(found);
        */
        $("#"+btnId).click(function() {
            var visible =  $('#' + gridId).is(':visible');
            if (visible){
                $("#"+gridId).hide();
            }
            else{
                $("#"+gridId).show();
            }
        });
    });
};


function formatMinSec(number){
    var min = Math.round(Math.floor(number / 60));
    var sec = Math.round(number - min * 60);
    
    var formattedTime = "";
    if (!isNaN(min)){
        min = Math.round(min);
        if (min == 0){
            min = "00";
        }
        else if (min > 0 && min < 10){
            min = "0" + min;
        }
    }
    else{
        min = "00";
    }
    if (!isNaN(sec)){
        if (sec == 0){
            sec = "00";
        }
        else if (sec > 0 && sec < 10){
            sec = "0" + sec;
        }
    }
    else{
        sec = "00";
    }
    formattedTime = min + ":" + sec;
    return formattedTime;
};

function loadEvent(eventId, optPlayId){
    try
        {
        var eventObj = { "eventId" : eventId, "optPlayId": optPlayId};
        $("#eventViewerEventId").html(String(eventId));
        $("#eventViewerPlayId").html(String(optPlayId));
        focusTool("event_viewer");
        //var videoUri = "/video?eventId=" + eventId;
        var videoUri  = api + '/playvideo/ncf/event/' + eventId;
        var results = "";
        var apiUri = masheryUri + eventId +"?apikey=" + apiKey;
        var event = "";
        var eventOut = "<br/>";
        $("#divEventViewerLoading").show();
        $("#eventViewerPH").show();
        $("#event_report_table").html("");
        $("#event_viewer_results").html("");
        $.getJSON(apiUri, function (data) {
            //console.log("hitting mashery API for ancillary data");
            if (data.sports[0].leagues[0].events.length == 0){
                msg = "Invalid Event <br>" + defaultErrorMsg;
                displayMessage("search", msg, "error");
                $("#divEventViewerLoading").hide();
                displayMessage("eventViewer", msg, "error");
                throw new Error(defaultErrorMsg);
                return;
            }
            // Assumuption: Mashery has this data.
            // TO-DO:  full error checking or patch as needed.
            var eventDate = "";
            var start = ""
            try{
                if (!!data.sports[0].leagues[0].events[0].date){
                    eventDate = data.sports[0].leagues[0].events[0].date;
                    start = ' @ '  + '<span style="color:black">'+ eventDate + '</span>';
                }
            }
            catch(err){
                console.log(data)
                console.log(apiUri);
                start = ' @ UNKNOWN - V1 Sorts API Error'
            }
            var vs =  '<span style="color:black"> vs. </span>';
            var competitors = data.sports[0].leagues[0].events[0].competitions[0].competitors;
            var home = competitors[0].team;
            var homeCol = home.color;
            var homeString  = home.nickname + " " + home.name;
            var homeRec = home['record']['summary'];
            var away = competitors[1].team;
            var awayCol = away['color'];
            var awayString = away.nickname + " " + away.name;
            var awayRec = away['record']['summary'];
            var awaySpan = '<span  style="color:#' + awayCol  + '">' + awayString + ' (' + awayRec + ') </span>';
            var homeSpan = '<span style="color:#' + homeCol  + '">' + homeString + ' (' + homeRec + ')  </span>';
            var eventBtnId = "btnEvent_" + eventId;
            var eventTitle = '<button class="btn" id="'+ eventBtnId+'">' +  awaySpan + vs + homeSpan + start + ' </button> </br>';
            var emailSubject =  awayString + " vs. " + homeString;
            var count = 0;
            var videoDataGrid = "";
            var videoGridWidth = "320";
            var videoGridHeight = "240";
            var tempVideoGrid = '<video width="'+ videoGridWidth +'" height="'+ videoGridHeight + '" controls><source src="http://brsweb.video-origin.espn.com/motion/lfc/milestones/video/mlbam/2013/0919/rth_espn_30760103_800k.mp4" type="video/mp4"></video>';
            var eventPlays = new Array();
            var plays = new Array();
            var eventUri  = api + '/ec/ncf/event/' + eventId;
            $.getJSON(eventUri, function (eventData) {
                $.each(eventData, function (k, v) {
                        var clipId = v.ceId;
                        var clipObject ={
                            "ceId" : clipId,
                            "duration" : v.duration,
                            "tagTime" : v.tagTime,
                            "pubTime" : v.pubTIme,
                            "clipEndTime" : v.clipEndTime,
                            "source" : v.source
                        }
                    eventPlays.push(clipObject) ;
                });
                $.getJSON(videoUri, function (videoData) {
                    var eventUri = baseUri + eventId;
                    var eventVideoUri = baseVideoUri + eventId;
                    var numberOfVideos = videoData.length;
                    var fastest = "unknown";
                    var slowest = "unknown";
                    var mlbamCount = 0;
                    var mlbamFirst = 0;
                    var mlbamAvgDiff = 0;
                    var mlbamAvgLat = 0;
                    var mlbamPert = 0;
                    var mlbamDuration = 0;
                    var ecCount = 0;
                    var ecFirst = 0;
                    var ecAvgDiff = 0;
                    var ecAvgLat = 0;
                    var ecPert = 0;
                    var ecDuration = 0;
                    var lcCount = 0;
                    var lcFirst = 0;
                    var lcAvgLat = 0;
                    var lcAvgDiff = 0;
                    var lcPert = 0;
                    var lcDuration = 0;

                    // iterate over video data
                    // determine how many clips belong to each type
                    // determine who was first each time
                    $.each(videoData, function (ki, vi) {
                        count ++;
                        var mlbamTable = "";
                        var lcTable = "";
                        var ecTable = "";
                        var mlbamInfo = "<b>Provider: </b>MLBAM<br/>";
                        var ecInfo = "<b>Provider: </b>EventClipper<br/>";
                        var lcInfo = "<b>Provider: </b>liveClips<br/>";
                        var videoList = vi.videoList;
                        var mlbamDate = 0;
                        var ecDate = 0;
                        var lcDate = 0;

                        var sortedVideos = sortVideos(videoList);
                        // Add to First Total
                        var firstVideo = sortedVideos[0];
                        var lit = new Date(firstVideo.publishedDate).getTime();
                        if (firstVideo.provider == "mlbam"){
                            mlbamFirst ++;
                        }
                        if (firstVideo.provider == "eventclipper"){
                            ecFirst ++;
                        }
                        if (firstVideo.provider == "liveclips"){
                            lcFirst ++;
                        }
                        // Base Start Time | JMS used if Event Clipper Not Present
                        var eventClipperTime = new Date(vi.eventClipperOutTime).getTime();
                        if (eventClipperTime == 0 ){
                            eventClipperTime= new Date(vi.playJmsReceived).getTime();
                        }
                        // TODO determine how to handle event clipper calculations
                        // **currently taking the last
                        var videoDisplay = new Array(); // array containing the final display elements
                        $.each(sortedVideos, function (kl, vl) {
                            if (vl.provider == "mlbam"){
                                mlbamCount ++;
                                mlbamDate = new Date(vl.publishedDate).getTime();
                                if (mlbamDate == 0){
                                    console.log("bad mlbamDate " + vl.ceId);
                                    //mlbamDate = 1380913708;
                                }
                                else{
                                    var mlbamTimeLat = ((mlbamDate - eventClipperTime) / 1000);
                                    var mlbamTimeDiff = ((mlbamDate - lit) / 1000);
                                    mlbamAvgDiff += mlbamTimeDiff;
                                    mlbamAvgLat += mlbamTimeLat;
                                }
                            }
                            if (vl.provider == "eventclipper"){
                                ecCount ++;
                                ecDate = new Date(vl.publishedDate).getTime();
                                if (ecDate == 0){
                                    console.log("bad ecDate " + vl.ceId);
                                    //ecDate = 1380913708;
                                }
                                else{
                                    var ecTimeLat  = ((ecDate - eventClipperTime) / 1000);
                                    var ecTimeDiff = ((ecDate - lit) / 1000);
                                    ecAvgDiff += ecTimeDiff;
                                    ecAvgLat += ecTimeLat;
                                    // Calculate Games Fastest EC
                                    if (fastest == "unknown"){
                                        fastest = ecTimeLat;
                                    }
                                    else{
                                        if (ecTimeLat < fastest){
                                            fastest = ecTimeLat;
                                        }
                                    }
                                    // Calculate Games Slowest EC
                                    if (slowest == "unknown"){
                                        slowest = ecTimeLat;
                                    }
                                    else{
                                        if (ecTimeLat > slowest){
                                            slowest = ecTimeLat;
                                        }
                                    }
                                }
                            }
                            if (vl.provider == "liveclips"){
                                lcCount ++;
                                lcDate = new Date(vl.publishedDate).getTime();
                                if (lcDate == 0){
                                    console.log("bad lcDate " + vl.ceId);
                                    //lcDate = 1380913708;
                                }
                                else{
                                    var lcTimeLat = ((lcDate - eventClipperTime) / 1000);
                                    var lcTimeDiff = ((lcDate - lit) / 1000);
                                    lcAvgDiff += lcTimeDiff;
                                    lcAvgLat += lcTimeLat;
                                }
                            }
                            var gridDisplay = '<video width="'+ videoGridWidth +'" height="'+ videoGridHeight + '" controls poster="' + vl.thumbnailUrl + '" onclick="changeSource(this, ' + "'" + vl.mp4Url  + "'" + ')" ></video>';
                            var vidDate = new Date(vl.publishedDate).getTime();
                            // Creating Color Coated Time Views
                            var diffView  = 'unknown';
                            var latView =  'unknown';
                            if (vidDate != 0){
                                var timeLat = ((vidDate - eventClipperTime) / 1000);
                                var timeDiff = ((vidDate - lit) / 1000);
                                diffView  = '(+' + formatMinSec(timeDiff) + ')';
                                latView =  '(+' + formatMinSec(timeLat) + ')';
                                if (timeDiff > 60){
                                    diffView = '<span style="color:red">' + diffView + '</span>';
                                }
                                else if (timeDiff > 30 && timeDiff < 60){
                                    diffView = '<span style="color:orange">' + diffView + '</span>';
                                }
                                else{
                                    diffView = '<span style="color:green">' + diffView + '</span>';
                                }
                                if (timeLat > 60){
                                    latView = '<span style="color:red">' + latView + '</span>';
                                }
                                else if (timeLat > 30 && timeLat < 60){
                                    latView = '<span style="color:orange">' + latView + '</span>';
                                }
                                else{
                                    latView = '<span style="color:green">' + latView + '</span>';
                                }
                            }
                            var ceLink = '<a href="' + vl.mp4Url + '"> ' + vl.ceId + '</a>';
                            //console.log(vl.pu);
                            var videoComponent = {
                                "data" : vl,
                                "display" : gridDisplay,
                                "mp4" : vl.mp4Url,
                                "ceId" : vl.ceId,
                                "diffView" : diffView,
                                "latView" : latView,
                                "ceLink" : ceLink,
                                "provider" : vl.provider
                            };
                            videoDisplay.push(videoComponent);
                        });

                        var editor = ""
                        /*if (isLoggedIn()) {
                            var disabled =  'disabled="disabled"'
                            if (getCookie("username") == 'jen'){
                                disabled = "";
                            }

                            editor =  '<div style="margin-top: -25px;"><h4>Editor</h4><table><tbody>';
                            var ddlThumbnail = '<select class="btn dropdown-toggle"  style = "width: 100px;" ' +disabled +'><option value="">Good</option><option value="">OK</option><option value="">Poor</option></select>';
                            var ddlOperator = '<select class="btn dropdown-toggle"  style = "width: 100px;" ' +disabled +'><option value="">Amber</option><option value="">Chris</option><option value="">w/e</option><option value="">w/e</option></select>';
                            //var txtClip = '<input class="input-medium" placeholder="Clip" />'
                            var btnSubmit = '&nbsp;<button id="btnSubmit" class="btn btn-success" ' + disabled  + '>Submit</button>'
                            var txtClip  = '<textarea class="field span8" id="textarea" rows="2"  placeholder="Enter clip info..." ' +disabled +'/>';

                            var editThumbnail = '<tr><td><b>Thumbnail: </b></td><td>' + ddlThumbnail + '</td>';
                            var editAudioIn = '<td><b>Audio In: </b></td><td>' + ddlThumbnail  + '</td>';;
                            var editAudioOut = '<td><b>Audio Out: </b></td><td>' + ddlThumbnail  + '</td>';
                            var editPlay= '<td><b>Play: </b></td><td>' + ddlThumbnail  + '</td>';
                            var editOperator = '<td><b>Operator: </b></td><td>' + ddlOperator  + '</td></tr>';
                            //var editClip = '<tr><td><b>Clip: </b></td><td>' + txtClip  + '</td></tr>';
                            var editClip = '<b>Clip:</b>&nbsp;' + txtClip;

                            //editor = editor + editThumbnail + editAudioIn + editAudioOut + editPlay + editOperator + editClip + '</tbody></table>';
                            editor = editor + editThumbnail + editAudioIn + editAudioOut + editPlay + editOperator + '</tbody></table><br/>' + editClip +  btnSubmit  +  '<br/>' +'</div>';
                        }*/

                        // Display The Video Data
                        var divider = '&nbsp;&nbsp;&nbsp;';
                        // TOP HALF
                        var gridPopdown = '<table><tbody><tr>';
                        $.each(videoDisplay, function (kl, vdo) {
                            gridPopdown += '<td>' + vdo.display + '</td>' + divider;
                            if (vdo.provider == "eventclipper"){
                                ecFound = true;
                            }
                        });
                        gridPopdown += '</tr>';
                        // BOTTOM HALF
                        var gridPopdownData = '<tr>';
                        var orderCount = 1;
                        $.each(videoDisplay, function (kl, vde) {
                            var order = '<b>Order </b> #' + orderCount  + '<br/>';
                            var provider = '<b>Provider: </b>' + vde.provider + '<br/>';
                            var videoInfo = order + provider +'<b>Delay </b>' + vde.latView + '<br/><b>Diff. </b>' + vde.diffView + '<br/><b>ceId: </b>' + vde.ceLink ;
                            gridPopdownData += '<td>' + videoInfo + '</td>' + divider;
                            orderCount ++;

                        });
                        gridPopdownData += '</tr></tbody></table><br/><br/>';

                        var contentEditor = "";
                        if (ecFound){
                            //contentEditor = editor;
                        }
                        var videoText = "";
                        var playText = '';
                        var emailSubject = "";
                        if (!!vi.playText){
                            videoText = vi.playText + '(' + vi.playId  + ')';
                            //emailSubject = vi.playText ;
                        }
                        else{
                            videoText = vi.playId;
                            //emailSubject = 'play ' + vi.playId;
                        }
                        emailSubject = videoText;
                        var shareUrl = hostUrl + '?eventId=' + eventId + '&playId=' + vi.playId;
                        var shareLink ='<a href="' + shareUrl + '"><i class="icon-share"></i>&nbsp;Share Play</a>';
                        var shareEmail ='&nbsp;| <a href="mailto: ?subject=' + emailSubject + '&body=View this play ' + shareUrl  + '"><i class="icon-envelope"></i>&nbsp;Email</a>';

                        /*var shortDate = vi.eventClipperOutTime;
                        if (!shortDate){
                            shortDate = vi.playJmsReceived;
                        }
                        shortDate = shortDate.substr(0,19);*/
                        var playId = String(vi.playId).trim();
                        var expandId = "btnExpand_" + playId;
                        var expandGrid = '<br/><button id="' + expandId + '" class="btn btn-info btn-mini">Toggle Videos&nbsp;<i class="icon-plus-sign"></i> </button>';
                        var gridId = "divGrid_" + playId;
                        // make the grid expand/collapse
                        //gridPopdown = expandGrid + '<div id="' + gridId + '" style="display: none;"> '  + gridPopdown + gridPopdownData + '</div><br/><br/>';
                        var horizontalStyle = ''
                        if (videoDisplay.length > 3){
                            horizontalStyle = 'style="width:1000px;height:420px;overflow-y:hidden;overflow-x:scroll;"';
                        }
                        gridPopdown = expandGrid + '<div id="' + gridId + '" ' + horizontalStyle + '  > '  + gridPopdown + gridPopdownData + contentEditor + '</div><br/><br/>';
                        expanded = true;
                        var gridHeader = '<i  class="icon-tag" id="' + vi.playId +'"></i>' + '#' + count + ' - <b>' + videoText + '</b> &nbsp;' + shareLink + shareEmail;
                        var videoGrid = gridHeader + gridPopdown;
                        plays.push(playId);
                        videoDataGrid += videoGrid;
                    });
                     if (mlbamCount != 0){
                         mlbamAvgDiff = formatMinSec(Math.round(mlbamAvgDiff / mlbamCount));
                         mlbamAvgLat = formatMinSec(Math.round((mlbamAvgLat / mlbamCount)));
                         mlbamPert = Math.round((mlbamCount / numberOfVideos).toFixed(2) * 100) + "%";
                     }
                     if (ecCount != 0){
                         ecAvgDiff = formatMinSec(Math.round(ecAvgDiff / ecCount));
                         ecAvgLat = formatMinSec(Math.round(ecAvgLat / ecCount));
                         ecPert = Math.round((ecCount / numberOfVideos).toFixed(2) * 100) + "%";
                     }
                     if (lcCount != 0){
                         lcAvgDiff = formatMinSec(Math.round(lcAvgDiff / lcCount));
                         lcAvgLat = formatMinSec(Math.round(lcAvgLat / lcCount));
                         lcPert = Math.round((lcCount / numberOfVideos).toFixed(2) * 100) + "%";
                     }
                    // Durations

                    var eventClips = eventPlays;
                    $.each(eventClips, function (kl, cl) {
                        if (cl.source == "eventclipper"){
                            ecDuration += cl.duration;
                        }
                        /*if (cl.source == "eventclipper"){
                         ecDuration += cl.duration;
                         }
                         if (cl.source == "eventclipper"){
                         lcDuration += cl.duration;
                         }*/
                    });
                    ecDuration = formatMinSec(ecDuration / ecCount);
                    var dtMlbamRow = [ "MLBAM" , mlbamCount, mlbamFirst, mlbamAvgLat, mlbamAvgDiff, mlbamPert, mlbamDuration];
                    var dtEcRow =  [ "EventClipper" , ecCount, ecFirst, ecAvgLat, ecAvgDiff, ecPert, ecDuration];
                    var dtLcRow = [ "LiveClips" , lcCount, lcFirst, lcAvgLat, lcAvgDiff, lcPert, lcDuration];
                    var eventUrl = hostUrl + '?eventId=' + eventId;
                    var eventLink ='<a href="' + eventUrl + '"><i class="icon-share"></i>&nbsp;Share Event</a>';
                    var eventEmail ='&nbsp;| <a href="mailto: ?subject=' + emailSubject + '&body=View this event ' + eventUrl  + '"><i class="icon-envelope"></i>&nbsp;Email</a>';
                    var event_viewer_header = eventTitle + '<a href="'+ eventUri +'" target="_blank">EC Endpoint</a>&nbsp;|&nbsp;' + '<a href="'+ eventVideoUri +'" target="_blank">EC Video Endpoint</a><br/> <i>Number of Milestones (' +  numberOfVideos + ' in Total):</i>&nbsp;' + eventLink + eventEmail +'<br/>';

                    eventOut += event;
                    // data tables
                    var dtTblId = "tbl_" + eventId;
                    var dtEventData = [ dtEcRow, dtLcRow, dtMlbamRow];
                    loadEventTableData(dtEventData , dtTblId);
                    if (count >= videoData.length){
                        results += eventOut + '<br/>';
                        results += videoDataGrid;
                        var msg = "Event Successfully Loaded! - Begin Comparison / Analysis";
                        displayMessage("eventViewer", msg, "success");
                        $("#event_viewer_header").html(event_viewer_header); //+ '<br/><br/><br/><br/><br/>');
                        // toggle all videos
                        var expandAllId = "btnExpandAll_" + eventId;
                        var expandAllButton = '<br/><button id="' + expandAllId + '" class="btn btn-info">Toggle All Plays&nbsp;<i class="icon-plus-sign"></i> </button>';
                        $("#event_viewer_results").html(expandAllButton + results);
                        // implement expand all button
                        $("#"+expandAllId).click(function() {
                            if (expanded){
                                // hide all
                                $.each(plays, function (k, id) {
                                    var gridId = "divGrid_" + id;
                                    $("#"+gridId).hide();
                                });
                                expanded = false;
                            }
                            else{
                                $.each(plays, function (k, id) {
                                    var gridId = "divGrid_" + id;
                                    $("#"+gridId).show();
                                });
                                expanded = true;
                            }
                        });
                        $("#divEventViewerLoading").hide();
                        generatePlayHandlers(plays);
                        // load game stats
                        var gameStats = "<table><tbody>";
                        // I care about the clip delay and the tag delay to critique my people. That would be awesome if I could see the average for the game, along with maybe the fastest and slowest clips.
                        // Will add fastest, slowest, and average.
                        var gameAvgDelay = ecAvgLat;
                        var gameAvgDiff = ecAvgDiff;
                        var gameFastest = formatMinSec(fastest);
                        var gameSlowest = formatMinSec(slowest);
                        gameStats += '<tr><td><b>Avg. Delay: </b></td><td>' + gameAvgDelay + '</td></tr>';
                        gameStats += '<tr><td><b>Avg. Diff: </b></td><td>' + gameAvgDiff + '</td></tr>';
                        gameStats += '<tr><td><b>Fastest: </b></td><td>' + gameFastest + '</td></tr>';
                        gameStats += '<tr><td><b>Slowest: </b></td><td>' + gameSlowest + '</td></tr></tbody></table>';
                        $("#dviGameStatsInfo").html(gameStats);
                        $("#popUpDiv").show();

                        if (optPlayId != 0){
                            focusTool(optPlayId);
                        }
                    }
                });
            });
        });
    }
    catch(err)
    {
        $("#divEventViewerLoading").hide()
        return;
    }
};

function loadSearchTableData(currentData, eventId, eventHeader){
    var tableId = "event_search_table_" + eventId;
    var tableContext='<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
    var addView = eventHeader + tableContext + '<br/><br/>';
    var lastView = $("#search_table_results").html();
    $("#search_table_results").html(lastView + addView);
    //$('#event_report_table').html(tableContext );
    //$("#" + tableId).dataTable().fnDestroy();
    $("#" + tableId).dataTable( {
        "aaData": currentData,
        "aaSorting": [ [3,'desc'] ],
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": false,
        "bJQueryUI": true,
        "sDom": '<"H"Cfr>t<"F"ip>',
        "aoColumns": [
            { 'sTitle' : 'Provider', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Clips', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'First', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Delay', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Diff', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Qty.	', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Duration', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' }
        ]
    } );

};

function loadEventTableData(currentData, eventId){
    var tableId = "event_report_table_" + eventId;
    var tableContext='<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
    $('#event_report_table').html(tableContext );
    //$("#" + tableId).dataTable().fnDestroy();;
    $("#" + tableId).dataTable( {
        "aaData": currentData,
        "aaSorting": [ [3,'desc'] ],
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": false,
        "bJQueryUI": true,
        "sDom": '<"H"Cfr>t<"F"ip>',
        "aoColumns": [
            { 'sTitle' : 'Provider', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Clips', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'First', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Delay', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Diff', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Qty.	', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Duration', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' }
        ]
    } );
};

function loadReportResults(currentData){
    var tableContext='<h4>Events During Reporting Interval</h4><table cellpadding="0" cellspacing="0" border="0" class="display" id="reportResultsTbl"></table>';
    $('#report_results_table').html(tableContext );
    //$("#reportTbl").dataTable().fnDestroy();
    $('#reportResultsTbl').dataTable( {
        "aaData": currentData,
        "aaSorting": [ [0,'desc'] ],
        "bJQueryUI": true,
        "sDom": 'T<"clear">lfrtip',
        /*"sDom": '<"H"Cfr>t<"F"ip>',*/
        "aoColumns": [
            { "sWidth": "40%", 'sTitle' : 'Title', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            //{ 'sTitle' : 'Mlbam Videos', 'bSortable': true, 'aTargets': [ 1 ] },
            //{ 'sTitle' : 'Mlbam First', 'bSortable': true, 'aTargets': [ 1 ] },
            { 'sTitle' : 'MLBAM Qty', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            //{ 'sTitle' : 'Event-Clipper Videos', 'bSortable': true, 'aTargets': [ 1 ] },
            //{ 'sTitle' : 'Event-Clipper First', 'bSortable': true, 'aTargets': [ 1 ] },
            { 'sTitle' : 'EventClipper Qty', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            //{ 'sTitle' : 'Live-Clips Videos', 'bSortable': true, 'aTargets': [ 1 ] },
            //{ 'sTitle' : 'Live-Clips First', 'bSortable': true, 'aTargets': [ 1 ] },
            { 'sTitle' : 'LiveClips Qty', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { "sWidth": "20%", 'sTitle' : 'Date', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'More Info', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' }
        ]
    } );

};

function loadReportData(currentData, start, end){
    var reportUrl = hostUrl + '?reportStart=' + start  + '&reportEnd=' + end;
    var emailSubject = "Clipper Reporting " + start + ' - ' + end;
    var reportLink ='<a href="' + reportUrl + '"><i class="icon-share"></i>&nbsp;Share Report</a>';
    var reportEmail ='&nbsp;| <a href="mailto: ?subject=' + emailSubject + '&body=View this report ' + reportUrl  + '"><i class="icon-envelope"></i>&nbsp;Email</a>';

    var tableContext= reportLink + reportEmail + '<table cellpadding="0" cellspacing="0" border="0" class="display" id="reportTbl"></table>';
    $('#report_table').html(tableContext );
    console.log(currentData);
    $('#reportTbl').dataTable( {
        "aaData": currentData,
        "aaSorting": [ [3,'desc'] ],
        "bFilter": false,
        "bPagination": false,
        "bJQueryUI": true,
        "bLengthChange": false,
        /*"sDom": '<"H"Cfr>t<"F"ip>',*/
        "sDom": 'T<"clear">lfrtip',
        "oTableTools": {
            "aButtons": [ "copy", "csv", "xls", "pdf",  "print" ],
            "sSwfPath": "media/swf/copy_csv_xls_pdf.swf"
        },
        "aoColumns": [
            { 'sTitle' : 'Provider', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Clips', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'First', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Delay', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Diff', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Qty.	', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'sTitle' : 'Avg. Duration.	', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' }
        ]
    } );

};

function loadSearchData(currData) {
    /**
     * Initialize DataTables
     */
    currentTableData = currData;
    $("#searchTable").dataTable().fnDestroy();
    $('#searchTable').dataTable( {
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": true,
        "bSort": true,
        "bInfo": false,
        "bAutoWidth": false,
        "bJQueryUI": true,
        "aaData": currData,
        "sDom": 'T<"clear">lfrtip',
        "oTableTools": {
            "aButtons": [ "print" ],
            "sSwfPath": "media/swf/copy_csv_xls_pdf.swf"
        },
        "aoColumns": [
            { 'bSortable': false, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'bSortable': false, 'aTargets': [ 1 ], 'sClass': 'center' },
            { 'bSortable': false, 'aTargets': [ 1 ], 'sClass': 'center' }
        ]
    } );
};

function generateReport(start, end){
    var reportObj = { "start" : start, "end": end};
    $("#reportId").html(String(reportObj));
    console.log("generateReport(start)");
    var generateStart = new Date().getTime();
    var startDate = start;
    var endDate = end;
    $("#divReportingLoading").show();
    $("#reporting_results_div").show();
    $('#report_table').html("" );
    $("#reporting_results").html("");
    $('#report_results_table').html("" );
    //var uri  = '/search?date=' + date;

    if (start == "" &&  end == ""){
        msg = "Start or End must have a value.";
        displayMessage("reporting", msg, "error");
        //loadSearchData([]);
        $("#divReportingLoading").hide();
    }
    else{
        try{
            var searchDate = "";
            var longDate = "";
            var totalClips = 0;
            var averageClipDuration = 0;
            var totalEvents = 0;
            var totalMlbamCount = 0;
            var totalEcCount = 0;
            var totalLcCount = 0;
            var totalMlbamDiff = 0;
            var totalEcDiff = 0;
            var totalLcDiff = 0;
            var totalMlbamDur = 0;
            var totalEcDur = 0;
            var totalLcDur = 0;
            var totalMlbamLat = 0;
            var totalEcLat = 0;
            var totalLcLat = 0;
            var totalMlbamPert = 0;
            var totalEcPert = 0;
            var totalLcPert = 0;
            var totalMlbamFirst = 0;
            var totalEcFirst = 0;
            var totalLcFirst = 0;
            var totalMlbamQlty = 0;
            var totalEcQlty = 0;
            var totalLcQlty = 0;
            var totalMlbamDuration = 0;
            var totalEcDuration = 0;
            var totalLcDuration = 0;

            if (start != ""){
                longDate = "?start=" + start;
                searchDate = "start='" + start + "'"
            }
            if (end != ""){
                if (longDate == ""){
                    longDate = "?end=" + end
                    searchDate = "end='" + end + "'";
                }
                else{
                    longDate = longDate + "&end=" + end
                    searchDate = searchDate + " & end='" + end + "'";
                }
            }
            //var uri  = '/search' + longDate;
            var uri = api + '/ec' + longDate;
            //console.log(uri);
            $.getJSON(uri, function (data) {
                //console.log(data);
                if (data.status == "err"){
                    msg = defaultErrorMsg;
                    displayMessage("reporting", msg, "error");
                    $("#divReportingLoading").hide()
                    throw new Error(defaultErrorMsg);
                    return;
                }
                var msg = "";
                //console.log(data);
                if (data.length == 0){
                    var dateSearch = ""
                    msg = "No data was found for " + searchDate +  ".";
                    displayMessage("reporting", msg, "error");
                    $("#divReportingLoading").hide()
                }
                else{
                    var events = new Array();
                    var plays = new Array();
                    $.each(data, function (k, v) {
                        // Gather the day's events
                        var eventId = v.dmEventInfo.eventId;
                        if (v.dmEventInfo.sport != "baseball"){
                            if (events.indexOf(eventId) == -1){
                                events.push(eventId);plays[eventId] = new Array();
                            }
                            var clipId = v.ceId;
                            var clipObject ={
                                "ceId" : clipId,
                                "duration" : v.duration,
                                "tagTime" : v.tagTime,
                                "pubTime" : v.pubTIme,
                                "clipEndTime" : v.clipEndTime,
                                "source" : v.source
                            }
                            plays[eventId].push(clipObject) ;
                        }
                    });
                    var results = "<br/>";
                    var eventOut = "";
                    var count = 0;
                    var prettyData = [];
                    $.each(events, function (k, v) {
                        var eventUri = baseUri + v;
                        var eventTitle = v;
                        var apiUri = masheryUri + v +"?apikey=" + apiKey;
                        //var videoUri = "/video?eventId=" + v;
                        var eventId = v;
                        var videoUri  = api + '/playvideo/ncf/event/' + eventId;
                        var prettyEvent = [];
                        var event = "";
                        //console.log("processing event -" + eventTitle);
                        $.getJSON(apiUri, function (data) {
                            // console.log("hitting mashery API for ancillary data");
                            // Assumuption: Mashery has this data.
                            // TO-DO:  full error checking or patch as needed.
                            var eventDate = "";
                            var start = ""
                            if (!!data.sports[0].leagues[0].events[0].date){
                                eventDate = data.sports[0].leagues[0].events[0].date;
                                start = ' @ '  + '<span style="color:black">'+ eventDate + '</span>';
                            }
                            var vs =  '<span style="color:black"> vs. </span>';
                            var competitors = data.sports[0].leagues[0].events[0].competitions[0].competitors;
                            var home = competitors[0].team;
                            var homeCol = home.color;
                            var homeString  = home.nickname + " " + home.name;
                            var homeRec = home['record']['summary'];
                            //var homeUrl = '<a>' + home['links']['api']['teams']['href'] + '?apikey=' + apiKey + '</a>';
                            var away = competitors[1].team;
                            var awayCol = away['color'];
                            var awayString = away.nickname + " " + away.name;
                            var awayRec = away['record']['summary'];
                            //var awayUrl = '<a>' + away['links']['api']['teams']['href'] + '?apikey=' + apiKey + '</a>';
                            var awaySpan = '<span  style="color:#' + awayCol  + '">' + awayString + ' (' + awayRec + ') </span>';
                            var homeSpan = '<span style="color:#' + homeCol  + '">' + homeString + ' (' + homeRec + ')  </span>';
                            var eventBtnId = "btnEvent_" + v;
                            eventTitle = '<button class="btn" id="'+ eventBtnId+'">' +  awaySpan + vs + homeSpan + start + ' </button> </br>';
                            var emailSubject =  awayString + " vs. " + homeString;
                            var awaySpanPretty = '<span  style="color:#' + awayCol  + '">' + awayString + '</span>';
                            var homeSpanPretty = '<span style="color:#' + homeCol  + '">' + homeString + ' </span>';
                            var prettyTitle = awaySpanPretty + vs + homeSpanPretty;
                            var prettyDate = start;
                            $.getJSON(videoUri, function (videoData) {
                                var eventVideoUri = baseVideoUri + eventId;
                                event +=  eventTitle + '<a href="'+ eventUri +'" target="_blank">EC Endpoint</a>&nbsp;|&nbsp;' + '<a href="'+ eventVideoUri +'" target="_blank">EC Video Endpoint</a>' ;
                                count ++;
                                var numberOfVideos = videoData.length;
                                //console.log(eventTitle + " has " + numberOfVideos + " videos");
                                var mlbamCount = 0;
                                var mlbamFirst = 0;
                                var mlbamAvgDiff = 0;
                                var mlbamAvgLat = 0;
                                var mlbamPert = 0;
                                var mlbamDuration = 0;
                                var ecCount = 0;
                                var ecFirst = 0;
                                var ecAvgDiff = 0;
                                var ecAvgLat = 0;
                                var ecPert = 0;
                                var ecDuration = 0;
                                var lcCount = 0;
                                var lcFirst = 0;
                                var lcAvgLat = 0;
                                var lcAvgDiff = 0;
                                var lcPert = 0;
                                var lcDuration = 0;
                                // iterate over video data
                                // determine how many clips belong to each type
                                // determine who was first each time
                                $.each(videoData, function (ki, vi) {
                                    var videoList = vi.videoList;
                                    var mlbamDate = 0;
                                    var ecDate = 0;
                                    var lcDate = 0;
                                    $.each(videoList, function (kl, vl) {
                                        if (vl.provider == "mlbam"){
                                            mlbamCount ++;
                                            mlbamDate = new Date(vl.publishedDate).getTime();
                                            if (isNaN(mlbamDate)){
                                                console.log("bad date mlbam");
                                                mlbamDate = 1380913708;
                                            }
                                        }
                                        if (vl.provider == "eventclipper"){
                                            ecCount ++;
                                            ecDate = new Date(vl.publishedDate).getTime();
                                            if (isNaN(ecDate)){
                                                console.log("bad date ec");
                                                ecDate = 1380913708;
                                            }
                                        }
                                        if (vl.provider == "liveclips"){
                                            lcCount ++;
                                            lcDate = new Date(vl.publishedDate).getTime();
                                            if (isNaN(lcDate)){
                                                console.log("bad date lc");
                                                lcDate = 1380913708;
                                            }
                                        }
                                    });
                                    // 'shananagins' that should also cover about clip-ties
                                    var arr = new Array();
                                    if (mlbamDate != 0){ arr.push(mlbamDate);}
                                    if (ecDate != 0){arr.push(ecDate);}
                                    if (lcDate != 0){arr.push(lcDate);}
                                    var lit = 0;
                                    if (arr.length >= 2){
                                        lit = Math.min.apply( Math, arr );
                                    }
                                    else{
                                        lit = arr[0];
                                    }
                                    if (lit != 0){
                                        if (lit == mlbamDate){
                                            mlbamFirst ++;
                                        }
                                        if (lit == ecDate){
                                            ecFirst ++;
                                        }
                                        if (lit == lcDate){
                                            lcFirst ++;
                                        }
                                    }
                                    var eventClipperTime = new Date(vi.eventClipperOutTime).getTime();
                                    if (eventClipperTime == 0 ){
                                        eventClipperTime= new Date(vi.playJmsReceived).getTime();
                                    }
                                    if (mlbamDate != 0){
                                        var mlbamTimeLat = ((mlbamDate - eventClipperTime) / 1000);
                                        var mlbamTimeDiff = ((mlbamDate - lit) / 1000);
                                        mlbamAvgDiff += mlbamTimeDiff;
                                        mlbamAvgLat += mlbamTimeLat;
                                    }
                                    if (ecDate != 0){
                                        var ecTimeLat  = ((ecDate - eventClipperTime) / 1000);
                                        var ecTimeDiff = ((ecDate - lit) / 1000);
                                        ecAvgDiff += ecTimeDiff;
                                        ecAvgLat += ecTimeLat;
                                    }
                                    if (lcDate != 0){
                                        var lcTimeLat = ((lcDate - eventClipperTime) / 1000);
                                        var lcTimeDiff = ((lcDate - lit) / 1000);
                                        lcAvgDiff += lcTimeDiff;
                                        lcAvgLat += lcTimeLat;
                                    }
                                });
                                // Calculations
                                if (mlbamCount != 0){
                                    mlbamAvgDiff = Math.round(mlbamAvgDiff / mlbamCount);
                                    totalMlbamDiff += mlbamAvgDiff;
                                    mlbamAvgDiff = formatMinSec(mlbamAvgDiff);
                                    mlbamAvgLat = Math.round((mlbamAvgLat / mlbamCount));
                                    totalMlbamLat += mlbamAvgLat;
                                    mlbamAvgLat = formatMinSec(mlbamAvgLat);
                                    mlbamPert = Math.round((mlbamCount / numberOfVideos).toFixed(2) * 100) + "%";
                                }
                                if (ecCount != 0){
                                    ecAvgDiff = Math.round(ecAvgDiff / ecCount);
                                    totalEcDiff += ecAvgDiff;
                                    ecAvgDiff = formatMinSec(ecAvgDiff);
                                    ecAvgLat = Math.round(ecAvgLat / ecCount);
                                    totalEcLat += ecAvgLat;
                                    ecAvgLat = formatMinSec(ecAvgLat);
                                    ecPert = Math.round((ecCount / numberOfVideos).toFixed(2) * 100) + "%";
                                }
                                if (lcCount != 0){
                                    lcAvgDiff = Math.round(lcAvgDiff / lcCount);
                                    totalLcDiff += lcAvgDiff;
                                    lcAvgDiff = formatMinSec(lcAvgDiff);
                                    lcAvgLat = Math.round(lcAvgLat / lcCount);
                                    totalLcLat += lcAvgLat;
                                    lcAvgLat = formatMinSec(lcAvgLat);
                                    lcPert = Math.round((lcCount / numberOfVideos).toFixed(2) * 100) + "%";
                                }

                                //
                                totalMlbamDur += 1;
                                totalEcDur += 1;
                                totalLcDur += 1;
                                totalMlbamFirst += mlbamFirst ;
                                totalEcFirst += ecFirst;
                                totalLcFirst += lcFirst;


                                // crazy finally doing the stupid sorting : D
                                //var sortedArr = arr.sort(function(a,b){return a-b});
                                var firstRow= "";
                                var secondRow = "";
                                var thirdRow = "";
                                var mlbamFound = false;
                                var ecFound = false;
                                var lcFound = false;
                                var mlbamRow = '<tr><td>MLBAM</td><td>' + mlbamCount + '</td><td>' + mlbamFirst  + '</td><td>' + mlbamAvgLat  + '</td><td>' + mlbamAvgDiff   + '</td><td>' + mlbamPert + '</td></tr>';
                                var ecRow = '<tr><td>EventClipper</td><td>' + ecCount + '</td><td>' + ecFirst  + '</td><td>' + ecAvgLat  + '</td><td>' + ecAvgDiff  + '</td><td>' + ecPert + '</td></tr>';
                                var lcRow = '<tr><td>LiveClips</td><td>' + lcCount + '</td><td>' + lcFirst  + '</td><td>' + lcAvgLat + '</td><td>' + lcAvgDiff + '</td><td>' + lcPert + '</td></tr>';
                                firstRow = mlbamRow;
                                secondRow = ecRow;
                                thirdRow = lcRow;
                                var eventUrl = hostUrl + '?eventId=' + eventId;
                                var eventLink ='<a href="' + eventUrl + '"><i class="icon-share"></i>&nbsp;Share Event</a>';
                                var eventEmail ='&nbsp;| <a href="mailto: ?subject=' + emailSubject + '&body=View this event ' + eventUrl  + '"><i class="icon-envelope"></i>&nbsp;Email</a>';
                                event += '<br/> <i>Number of Milestones (' +  numberOfVideos + ' in Total):</i>&nbsp;' + eventLink + eventEmail + '<br/>';
                                var tableStart = '<table class="table table-bordered table-hover table-condensed" style="width: auto;"><thead><tr><th align="center">Provider</th><th align="center">Clips</th><th align="center">First</th><th align="center">Avg. Delay</th><th align="center">Avg. Diff</th><th align="center" >Qty.</th align="center"></tr></thead><tbody>';
                                var tableBody =  firstRow + secondRow + thirdRow;
                                var tableEnd =  '</tbody></table>';

                                //var prettyLink = '<a href="' + eventUrl + '">' + prettyTitle + '</a>';
                                //var prettyLink = '<a href="' + eventUrl + '"> VIEW </a>';
                                var prettyLink = '<button class="btn btn-info btn-mini" id="btnViewEvent_' + eventId + '" >View</button>' ;

                                prettyEvent.push(prettyTitle);
                                //prettyEvent.push(mlbamCount);
                                //prettyEvent.push(mlbamFirst);
                                prettyEvent.push(mlbamPert);
                                //prettyEvent.push(ecCount);
                                //prettyEvent.push(ecFirst);
                                prettyEvent.push(ecPert);
                                //prettyEvent.push(lcCount);
                                //prettyEvent.push(lcFirst);
                                prettyEvent.push(lcPert);
                                prettyEvent.push(prettyDate);
                                prettyEvent.push(prettyLink);
                                prettyData.push(prettyEvent);
                                //TODO XXXXX
                                //prettyData.push(prettyEvent);

                                //event += tableStart + tableBody + tableEnd;
                                //eventOut += event;

                                // report content  calculations
                                totalMlbamCount += mlbamCount;
                                totalEcCount += ecCount;
                                totalLcCount += lcCount;
                                totalClips += mlbamCount + ecCount + lcCount;

                                if (count >= events.length){
                                    totalEvents = events.length;
                                    results += eventOut;
                                    results += "<br/>";
                                    totalMlbamPert = Math.round((totalMlbamCount / totalClips).toFixed(2) * 100) + "%";
                                    totalEcPert = Math.round((totalEcCount / totalClips).toFixed(2) * 100) + "%";
                                    totalLcPert = Math.round((totalLcCount / totalClips).toFixed(2) * 100) + "%";

                                    totalMlbamDiff = formatMinSec(Math.round(totalMlbamDiff / totalMlbamCount));

                                    totalMlbamLat = formatMinSec(Math.round((totalMlbamLat / totalMlbamCount)));

                                    totalEcDiff = formatMinSec(Math.round(totalEcDiff / totalEcCount));
                                    totalEcLat = formatMinSec(Math.round(totalEcLat / totalEcCount));

                                    totalLcDiff = formatMinSec(Math.round(totalLcDiff / totalLcCount));
                                    totalLcLat = formatMinSec(Math.round(totalLcLat / totalLcCount));

                                    totalMlbamQlty = totalMlbamPert;
                                    totalEcQlty = totalEcPert;
                                    totalLcQlty = totalLcPert;


                                    /*var dtMlbamRow = [ "MLBAM" , mlbamCount, mlbamFirst, mlbamAvgLat, mlbamAvgLat, mlbamPert];
                                    var dtEcRow =  [ "EventClipper" , ecCount, ecFirst, ecAvgLat, ecAvgLat, ecPert];
                                    var dtLcRow = [ "LiveClips" , lcCount, lcFirst, lcAvgLat, lcAvgLat, lcPert];   */
                                    // Durations
                                    var eventClips =  new Array();
                                    eventClips = plays[eventId];
                                    $.each(eventClips, function (kl, cl) {
                                        if (cl.source == "eventclipper"){
                                            totalEcDuration += cl.duration;
                                        }
                                        /*if (cl.source == "eventclipper"){
                                         ecDuration += cl.duration;
                                         }
                                         if (cl.source == "eventclipper"){
                                         lcDuration += cl.duration;
                                         }*/
                                    });
                                    totalEcDuration = formatMinSec(totalEcDuration / totalEcCount);

                                    var finalMlbamRow =  [ "MLBAM" , totalMlbamCount, totalMlbamFirst, totalMlbamLat, totalMlbamDiff, totalMlbamPert, totalMlbamDuration];
                                    var finalEcRow = [ "EventClipper" , totalEcCount, totalEcFirst, totalEcLat, totalEcDiff, totalEcPert, totalEcDuration ];
                                    var finalLcRow = [ "LiveClips" , totalLcCount, totalLcFirst, totalLcLat, totalLcDiff, totalLcPert, totalLcDuration];

                                    // data tables
                                    var dtEventData = [ finalMlbamRow, finalEcRow, finalLcRow];
                                    loadReportData(dtEventData, startDate, endDate);

                                    //loadLargeReport()
                                    loadReportResults(prettyData);

                                    /*A fairly issue free week, by all accounts.  Event clipper is once again polling the v1 apis, to augment the jms plays topic,  in order to get all plays for events available for the clipping operators.  All numbers for this week are our best yet, mostly attributed to improved speed & skill from the operators.

                                        Clipped 525 plays across 22 games.  (+98,-3)  Average clip duration was 25 seconds.  (+2)

                                    The time from the identified play end to the clip being sent through the system averaged 1:02, with the fastest at 6 seconds. (-10,-14)
                                    The time from the identified play end to receiving the play data averaged 1:17, with the slowest at 43:52.  (0,+9)
                                    The time from the play data arriving to the clip being associated to it averaged 0:42 (+/- 5 seconds) (-7)
                                    The average time behind live for the end to end process was 3:31, with the fastest at 1:24. (-15,-14)

                                    For comparison, here’s how our other providers did:
                                        LiveClip’s average end to end time was 3:29 with their fastest at 1:01  (-2,-19)
                                    MLBAM’s average end to end time was 5:03 with their fastest at 1:29 (+2:32,+5)*/
                                    var generationTime = 0;
                                    var generateEnd = new Date().getTime();
                                    generationTime = formatMinSec((generateEnd - generateStart) / 1000);

                                    msg = "Data found for '" + searchDate + "' => " + events.length + " events with " + totalClips + " total clips.<br/> ";
                                    //msg += "<b>Average Clip Duration: </b> " + averageClipDuration + "<br/> ";
                                    msg += "<b>Time to Generate Report: </b>" + generationTime + "<br/> ";
                                    //Clipped 525 plays across 22 games.  (+98,-3)  Average clip duration was 25 seconds.  (+2)
                                    displayMessage("reporting", msg, "success");
                                    //$("#reporting_results").html(results);
                                    //report_table
                                    // generate button handlers
                                    generateEventViewHandlers(events);
                                    $("#divReportingLoading").hide();
                                }
                            });
                        });
                    });
                }


            });
        }
        catch(err){

        }
    }
    console.log("generateReport(end)");
};

function loadDate(date){
    try{
        var searchObj = { "date" : date};
        $("#searchId").html(String(searchObj));
        console.log("loadDate(start)");
        $("#divSearchLoading").show();
        $("#search_results_div").show();
        $("#search_table_results").html("");
        //var searchUri  = '/search?end=' + date;
        var searchUri  = api + '/ec?end=' + date;
        var searchMsg = "";
        //console.log(searchUri);
        $.getJSON(searchUri, function (searchData) {
            if (searchData.status == "err"){
                msg = defaultErrorMsg;
                displayMessage("search", msg, "error");
                $("#divSearchLoading").hide()
                throw new Error(defaultErrorMsg);
                return;
            }
            if (searchData.length == 0){
                msg = "No data was found for '" + date + "'";
                displayMessage("search", msg, "error");
                $("#divSearchLoading").hide()
                return;
            }
            else{
                // Gather the day's events
                var events = new Array();
                var plays = new Array();
                $.each(searchData, function (k, v) {
                    var eventId = v.dmEventInfo.eventId;
                    if (v.dmEventInfo.sport != "baseball"){
                        if (events.indexOf(eventId) == -1){
                            events.push(eventId);
                            plays[eventId] = new Array();
                        }
                        var clipId = v.ceId;
                        var clipObject ={
                            "ceId" : clipId,
                            "duration" : v.duration,
                            "tagTime" : v.tagTime,
                            "pubTime" : v.pubTIme,
                            "clipEndTime" : v.clipEndTime,
                            "source" : v.source
                        }
                        plays[eventId].push(clipObject) ;
                        //plays[eventId].push(clipId);
                        //plays[eventId][clipId] = clipObject;
                    }
                });
                var count = 0;
                $.each(events, function (k, v) {
                    var eventUri = baseUri + v;
                    var eventTitle = v;
                    var apiUri = masheryUri + v +"?apikey=" + apiKey;
                    var videoUri  = api + '/playvideo/ncf/event/' + v;
                    var eventId = v;
                    $.getJSON(apiUri, function (apiData) {
                        var eventDate = "";
                        var start = ""
                        try
                        {
                            if (!(typeof apiData.sports[0].leagues[0].events[0].date != 'undefined')){
                                eventDate = apiData.sports[0].leagues[0].events[0].date;
                                start = ' @ '  + '<span style="color:black">'+ eventDate + '</span>';
                            }
                        }
                        catch(err){
                            console.log(data)
                            console.log(apiUri);
                            start = ' @ UNKNOWN - V1 Sorts API Error'
                        }
                        var vs =  '<span style="color:black"> vs. </span>';
                        var competitors = apiData.sports[0].leagues[0].events[0].competitions[0].competitors;
                        var home = competitors[0].team;
                        var homeCol = home.color;
                        var homeString  = home.nickname + " " + home.name;
                        var homeRec = home['record']['summary'];
                        var away = competitors[1].team;
                        var awayCol = away['color'];
                        var awayString = away.nickname + " " + away.name;
                        var awayRec = away['record']['summary'];
                        var awaySpan = '<span  style="color:#' + awayCol  + '">' + awayString + ' (' + awayRec + ') </span>';
                        var homeSpan = '<span style="color:#' + homeCol  + '">' + homeString + ' (' + homeRec + ')  </span>';
                        var eventBtnId = "btnEvent_" + v;
                        eventTitle = '<button class="btn" id="'+ eventBtnId+'">' +  awaySpan + vs + homeSpan + start + ' </button> </br>';
                        var emailSubject =  awayString + " vs. " + homeString;
                        $.getJSON(videoUri, function (videoData) {
                            var eventVideoUri = baseVideoUri + eventId;
                            //event +=  eventTitle + '<a href="'+ eventUri +'" target="_blank">EC Endpoint</a>&nbsp;|&nbsp;' + '<a href="'+ eventVideoUri +'" target="_blank">EC Video Endpoint</a>' ;
                            count ++;
                            var numberOfVideos = videoData.length;
                            var mlbamCount = 0;
                            var mlbamFirst = 0;
                            var mlbamAvgDiff = 0;
                            var mlbamAvgLat = 0;
                            var mlbamPert = 0;
                            var mlbamDuration = 0;
                            var ecCount = 0;
                            var ecFirst = 0;
                            var ecAvgDiff = 0;
                            var ecAvgLat = 0;
                            var ecPert = 0;
                            var ecDuration = 0;
                            var lcCount = 0;
                            var lcFirst = 0;
                            var lcAvgLat = 0;
                            var lcAvgDiff = 0;
                            var lcPert = 0;
                            var lcDuration = 0;
                            var allVideos = new Array();
                            // iterate over video data
                            // determine how many clips belong to each type
                            // determine who was first each time
                            $.each(videoData, function (ki, vi) {
                                var videoList = vi.videoList;
                                var mlbamDate = 0;
                                var ecDate = 0;
                                var lcDate = 0;
                                var sortedVideos = sortVideos(videoList);
                                // Add to First Total
                                var firstVideo = sortedVideos[0];
                                var lit = new Date(firstVideo.publishedDate).getTime();
                                if (firstVideo.provider == "mlbam"){
                                    mlbamFirst ++;
                                }
                                if (firstVideo.provider == "eventclipper"){
                                    ecFirst ++;
                                }
                                if (firstVideo.provider == "liveclips"){
                                    lcFirst ++;
                                }
                                // Base Start Time | JMS used if Event Clipper Not Present
                                var eventClipperTime = new Date(vi.eventClipperOutTime).getTime();
                                if (eventClipperTime == 0 ){
                                    eventClipperTime= new Date(vi.playJmsReceived).getTime();
                                }
                                // TODO determine how to handle event clipper calculations
                                // **currently taking the last
                                $.each(sortedVideos, function (kl, vl) {
                                    if (vl.provider == "mlbam"){
                                        mlbamCount ++;
                                        mlbamDate = new Date(vl.publishedDate).getTime();
                                        if (mlbamDate == 0){
                                            console.log("bad mlbamDate " + vl.ceId);
                                            //mlbamDate = 1380913708;
                                        }
                                        else{
                                            var mlbamTimeLat = ((mlbamDate - eventClipperTime) / 1000);
                                            var mlbamTimeDiff = ((mlbamDate - lit) / 1000);
                                            mlbamAvgDiff += mlbamTimeDiff;
                                            mlbamAvgLat += mlbamTimeLat;
                                        }
                                    }
                                    if (vl.provider == "eventclipper"){
                                        ecCount ++;
                                        ecDate = new Date(vl.publishedDate).getTime();
                                        if (ecDate == 0){
                                            console.log("bad ecDate " + vl.ceId);
                                            //ecDate = 1380913708;
                                        }
                                        else{
                                            var ecTimeLat  = ((ecDate - eventClipperTime) / 1000);
                                            var ecTimeDiff = ((ecDate - lit) / 1000);
                                            ecAvgDiff += ecTimeDiff;
                                            ecAvgLat += ecTimeLat;
                                        }
                                    }
                                    if (vl.provider == "liveclips"){
                                        lcCount ++;
                                        lcDate = new Date(vl.publishedDate).getTime();
                                        if (lcDate == 0){
                                            console.log("bad date lc" + vl.ceId);
                                            //lcDate = 1380913708;
                                        }
                                        else{
                                            var lcTimeLat = ((lcDate - eventClipperTime) / 1000);
                                            var lcTimeDiff = ((lcDate - lit) / 1000);
                                            lcAvgDiff += lcTimeDiff;
                                            lcAvgLat += lcTimeLat;
                                        }
                                    }
                                });
                            });
                            // Calculations
                            if (mlbamCount != 0){
                               mlbamAvgDiff = formatMinSec(Math.round(mlbamAvgDiff / mlbamCount));
                               mlbamAvgLat = formatMinSec(Math.round((mlbamAvgLat / mlbamCount)));
                               mlbamPert = Math.round((mlbamCount / numberOfVideos).toFixed(2) * 100) + "%";
                            }
                            if (ecCount != 0){
                               ecAvgDiff = formatMinSec(Math.round(ecAvgDiff / ecCount));
                               ecAvgLat = formatMinSec(Math.round(ecAvgLat / ecCount));
                               ecPert = Math.round((ecCount / numberOfVideos).toFixed(2) * 100) + "%";
                            }
                            if (lcCount != 0){
                               lcAvgDiff = formatMinSec(Math.round(lcAvgDiff / lcCount));
                               lcAvgLat = formatMinSec(Math.round(lcAvgLat / lcCount));
                               lcPert = Math.round((lcCount / numberOfVideos).toFixed(2) * 100) + "%";
                            }
                            // Durations
                            var eventClips =  new Array();
                            eventClips = plays[eventId];
                            $.each(eventClips, function (kl, cl) {
                                if (cl.source == "eventclipper"){
                                    ecDuration += cl.duration;
                                }
                                /*if (cl.source == "eventclipper"){
                                    ecDuration += cl.duration;
                                }
                                if (cl.source == "eventclipper"){
                                    lcDuration += cl.duration;
                                }*/
                            });
                            ecDuration = formatMinSec(ecDuration / ecCount);

                            // Final Data Scrubbing
                            var dtMlbamRow = [ "MLBAM" , mlbamCount, mlbamFirst, mlbamAvgLat, mlbamAvgDiff, mlbamPert, mlbamDuration];
                            var dtEcRow =  [ "EventClipper" , ecCount, ecFirst, ecAvgLat, ecAvgDiff, ecPert, ecDuration];
                            var dtLcRow = [ "LiveClips" , lcCount, lcFirst, lcAvgLat, lcAvgDiff, lcPert, lcDuration];
                            var eventUrl = hostUrl + '?eventId=' + eventId;
                            var eventLink ='<a href="' + eventUrl + '"><i class="icon-share"></i>&nbsp;Share Event</a>';
                            var eventEmail ='&nbsp;| <a href="mailto: ?subject=' + emailSubject + '&body=View this event ' + eventUrl  + '"><i class="icon-envelope"></i>&nbsp;Email</a>';
                            var event_viewer_header = eventTitle + '<a href="'+ eventUri +'" target="_blank">EC Endpoint</a>&nbsp;|&nbsp;' + '<a href="'+ eventVideoUri +'" target="_blank">EC Video Endpoint</a><br/> <i>Number of Milestones (' +  numberOfVideos + ' in Total):</i>&nbsp;' + eventLink + eventEmail + '<br/>';
                            var dtTblId = "tbl_" + eventId;
                            var dtEventData = [ dtEcRow, dtLcRow, dtMlbamRow];
                            loadSearchTableData(dtEventData , dtTblId, event_viewer_header);
                            if (count >= events.length){
                                msg = "Data found for '" + date + "' => " + events.length + " events.";
                                displayMessage("search", msg, "success");
                                // generate button handlers
                                generateHandlers(events);
                                $("#divSearchLoading").hide()
                            }
                       });
                    });
                });
            }
        });
    }
    catch(err)
    {
        console.log("loadDate(err)");
        console.log(err);
        $("#divSearchLoading").hide()
        return;
    }
    console.log("loadDate(end)");
};

function initPage() {
    console.log("Initialize Page Start");

    // Check Login Status
    checkLoginStatus();

    /**
     * Initialize Datepicker
     */
    $("#txtSearch").datepicker({
        showOn: 'button',
        buttonImageOnly:true,
        buttonImage:'icon_cal.png',
        dateFormat:'yymmdd' });

    var today = timeNow().toString().substr(0, 10);
    today = today.replace("-", "");
    today = today.replace("-", "");
    $("#txtSearch").val(today);


    $("#txtReportStart").datepicker({
        showOn: 'button',
        buttonImageOnly:true,
        buttonImage:'icon_cal.png',
        dateFormat:'yymmdd' });


    $("#txtReportEnd").datepicker({
        showOn: 'button',
        buttonImageOnly:true,
        buttonImage:'icon_cal.png',
        dateFormat:'yymmdd' });

    $("#txtReportStart").val(today);
    $("#txtReportEnd").val(today);

    // Parase URI Parameter for "deep linking"
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });

    var reportStart = "";
    var reportEnd = "";
    if (!!vars.reportStart){
        reportStart = vars.reportStart;
    }
    if (!!vars.reportEnd){
        reportEnd = vars.reportEnd;
    }
    if (reportStart != ""  && reportEnd != ""){
        focusTool("reporting_alerts_div");
        $("#txtReportStart").val(reportStart);
        $("#txtReportEnd").val(reportEnd);
        generateReport(reportStart, reportEnd);
    }

    if (!!vars.eventId){
        var playId =  0;
        if (!!vars.playId){
            playId = vars.playId;
        }
        loadEvent(vars.eventId, playId);
    }

   /* setInterval(function(){
        // method to be executed;
        manualRefresh();
    },30000);*/

    console.log("Initialize Page End");
};


$(document).ready(function (e) {
    // Load UI(s)/Data
    initPage();

    $('#btnSearchToday').click(function () {
        var today = timeNow().toString().substr(0, 10);
        today = today.replace("-", "");
        today = today.replace("-", "");
        $("#txtSearch").val(today);
    });

    $('#btnSearch').click(function () {
        focusTool("searchSection");
        clearMessage("search");
        var searchDate = $("#txtSearch").val();
        loadDate(searchDate);
    });

    $('#btnReport').click(function () {
        focusTool("reporting_alerts_div");
        clearMessage("reporting");
        var startDate = $("#txtReportStart").val();
        var endDate = $("#txtReportEnd").val();
        generateReport(startDate, endDate);
    });

    // Clear the Report Dates and Refocus the page view
    $('#btnResetReport').click(function () {
        focusTool("reporting_alerts_div");
        clearMessage("reporting");
        $('#report_table').html("" );
        $('#report_results_table').html("" );
        var today = timeNow().toString().substr(0, 10);
        today = today.replace("-", "");
        today = today.replace("-", "");
        $("#txtReportStart").val(today);
        $("#txtReportEnd").val(today);
    });

    $('#btnSearchKey').click(function () {
        var keyInfo = '<h3>Search Key</h3><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Provider </td><td>The video content provider name.</td></tr>';
        keyInfo += '<tr><td>Clips </td><td>The number of clips the provider supplied for the given game.</td></tr>';
        keyInfo += '<tr><td>First </td><td>The number of times the provider was the first one to publish a clip for an event.</td></tr>';
        keyInfo += '<tr><td>Avg. Delay </td><td>The average time it took the provider to publish a clip from the event clipper out time. (end-to-end delay)</td></tr>';
        keyInfo += '<tr><td>Avg. Diff </td><td>The average time it took the provider to produce a clip after the first provider published.</td></tr>';
        keyInfo += '<tr><td>Qty. </td><td>The percentage of events the provider has clips for.</td></tr>';
        keyInfo += '<tr><td>Avg. Duration </td><td>The average clip duration.</td></tr></tbody></table>';
        bootbox.alert(keyInfo, function() {});
    });

    $('#btnEventKey').click(function () {
        var keyInfo = '<h3>Event Viewer Key</h3><h4>Table Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Provider </td><td>The video content provider name.</td></tr>';
        keyInfo += '<tr><td>Clips </td><td>The number of clips the provider supplied for the given game</td></tr>';
        keyInfo += '<tr><td>First </td><td>The number of times the provider was the first one to publish a clip for an event.</td></tr>';
        keyInfo += '<tr><td>Avg. Delay </td><td>The average time it took a provider to publish a clip from the event clipper out time. (end-to-end delay)</td></tr>';
        keyInfo += '<tr><td>Avg. Diff </td><td>The average time it took the provider to produce a clip after the first provider published.</td></tr>';
        keyInfo += '<tr><td>Qty. </td><td>The percentage of events the provider has clips for.</td></tr>';
        keyInfo += '<tr><td>Avg. Duration </td><td>The average clip duration.</td></tr></tbody></table>';
        keyInfo += '<h4>Event Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Order </td><td>The position in which the provider published (#1, #2, #3)</td></tr>';
        keyInfo += '<tr><td>Provider </td><td>The video content provider name.</td></tr>';
        keyInfo += '<tr><td>Delay </td><td>The time it took the provider to publish a clip from the event clipper out time. (end-to-end delay)</td></tr>';
        keyInfo += '<tr><td>Diff. </td><td>The time it took the provider to produce a clip after the first provider published.</td></tr>';
        keyInfo += '<tr><td>&nbsp;</td><td><b>Color Guide</b></td></tr>';
        keyInfo += '<tr><td><span style="color:green">(+x) </td><td>less than 30 seconds</td></tr>';
        keyInfo += '<tr><td><span style="color:orange">(+x)</td><td>between 30 - 60 seconds</td></tr>';
        keyInfo += '<tr><td><span style="color:red">(+x)</td><td>more than 60 seconds</td></tr></tbody></table>';
        bootbox.alert(keyInfo, function() {});

    });

    $('#btnReportKey').click(function () {
        var keyInfo = '<h3>Reporting Key</h3><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Provider </td><td>The video content provider name.</td></tr>';
        keyInfo += '<tr><td>Clips </td><td>The number of clips the provider supplied over the reporting interval.</td></tr>';
        keyInfo += '<tr><td>First </td><td>The number of times the provider was the first one to publish a clip for an event.</td></tr>';
        keyInfo += '<tr><td>Avg. Delay </td><td>The average time it took the provider to publish a clip from the event clipper out time. (end-to-end delay)</td></tr>';
        keyInfo += '<tr><td>Avg. Diff </td><td>The average time it took the provider to produce a clip after the first provider published</td></tr>';
        keyInfo += '<tr><td>Qty. </td><td>The percentage of events the provider has clips for.</td></tr>';
        keyInfo += '<tr><td>Avg. Duration </td><td>The average clip duration.</td></tr></tbody></table>';
        keyInfo += '<h4>Events Reporting Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Title </td><td>The away and home teams for the game.</td></tr>';
        keyInfo += '<tr><td>MLBAM Qty. </td><td>The percentage of events for this game that MLBAM has videos for.</td></tr>';
        keyInfo += '<tr><td>EventClipper Qty. </td><td>The percentage of events for this game that Event-Clipper has videos for.</td></tr>';
        keyInfo += '<tr><td>LiveClips Qty. </td><td>The percentage of events for this game that Live-Clips has videos for.</td></tr>';
        keyInfo += '<tr><td>Date </td><td>The date and time at which the game took place.</td></tr>';
        keyInfo += '<tr><td>More Info</td><td>This column contains links to a closer view of the event, which includes more data and the actual videos.</td></tr></tbody></table>';
        bootbox.alert(keyInfo, function() {});
    });

    // User Information  - Login

    $('#btnLogout').click(function (e) {
        delCookie("username");
        e.preventDefault();
        $('#divLogout').hide();
        $('#feedbackLink').hide();
        $('#btnUserInfo').html("Logging");
        $('#divLogin').show();
        return false;
    });

    $('#btnSignIn').click(function (e) {
        e.preventDefault();
        var errs = "";
        var uname = String( $('#txtUname').val());
        var validUname =  false;
        if (uname == "") {
            errs = errs + ' Username ';
        }
        else {
            validUname = validateUname(uname);
            if (validUname == false){
                errs = errs + ' Username (invalid) ';
            }
        }
        var pword = String( $('#txtPword').val());
        var validPword = false;
        if (pword == "") {
            errs = errs + ' | Password  ';
        }
        else {
            validPword = validatePword(pword);
            if (validPword == false){
                errs = errs + ' | Password (invaild - "at least 6 characters are required") ';
            }
        }
        var validCreds = false;
        if (validPword && validUname){
            validCreds = validateCreds(uname,pword);
            if (validCreds == false){
                errs = errs + ' Invalid Credentials ';
            }
        }
        else{
            if (validCreds == false){
                errs = errs + ' Invalid Credentials ';
            }
        }
        if (String(errs) !== ""){
            //console.log(errs);
            window.alert(errs);
            return false;
        }
        else {
            // log them in
            // setCookie("username",uname,1);
            // updateRibbon()
            setCookie("username",uname,1);
            $('#txtUname').val("");
            $('#txtPword').val("");
            $('#divLogin').hide();
            $('#btnUserInfo').html(getCookie("username"));
            $('#divLogout').show();
            $('#feedbackLink').show();

        }
    });

    $('#hidePopUp').click(function () {
        $('#popUpDiv').hide();
    });

    $('#btnEmbeddedPopUp').click(function () {
        $('#popUpDiv').show();
    });

    // Button Linking
    $('#btnSearchLink').click(function () {
        focusTool("searchSection");
    });

    $('#btnSearchLink2').click(function () {
        focusTool("searchSection");
    });

    $('#btnEventViewerLink').click(function () {
        focusTool("event_viewer");
    });

    $('#btnReportingLink').click(function () {
        focusTool("reporting_alerts_div");
    });

    $('#btnInfoLink').click(function () {
        focusTool("info_div");
    });

});

//
// TIME Information
//
function calculate_time_zone() {
    var rightNow = new Date();
    var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);  // jan 1st
    var june1 = new Date(rightNow.getFullYear(), 6, 1, 0, 0, 0, 0); // june 1st
    var temp = jan1.toGMTString();
    var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
    temp = june1.toGMTString();
    var june2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
    var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60);
    var daylight_time_offset = (june1 - june2) / (1000 * 60 * 60);
    var dst;
    if (std_time_offset == daylight_time_offset) {
        dst = "0"; // daylight savings time is NOT observed
    } else {
        // positive is southern, negative is northern hemisphere
        var hemisphere = std_time_offset - daylight_time_offset;
        if (hemisphere >= 0)
            std_time_offset = daylight_time_offset;
        dst = "1"; // daylight savings time is observed
    }
    var i;
    // check just to avoid error messages
    // format time
    var numExt  = parseInt(std_time_offset);
    var strExt = convert(std_time_offset);
    var d = new Date();
    d.setHours(d.getHours() + numExt);
    var val = d.toISOString();
    var date =  val.substring(0, val.length - 5) + String(strExt);
    return date;
};

function convert(value) {
    var hours = parseInt(value);
    value -= parseInt(value);
    value *= 60;
    var mins = parseInt(value);
    value -= parseInt(value);
    value *= 60;
    var secs = parseInt(value);
    var display_hours = hours;
    // handle GMT case (00:00)
    if (hours == 0) {
        display_hours = "00";
    } else if (hours > 0) {
        // add a plus sign and perhaps an extra 0
        display_hours = (hours < 10) ? "+0"+hours : "+"+hours;
    } else {
        // add an extra 0 if needed
        display_hours = (hours > -10) ? "-0"+Math.abs(hours) : hours;
    }

    mins = (mins < 10) ? "0"+mins : mins;
    return display_hours+":"+mins;
};

function convertTime(time) {
    // worthless?
    if (time === ""){
        return time;
    }
    return time;
};

function timeNow() {
    return calculate_time_zone();
};
