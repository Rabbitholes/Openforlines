// feedback.js - 10/2013 by Matthew Schmitz
//
// feedback.js - a Web-UI Feedback tool for EventClipper Operators

// Global Variables
var api = "http://api.cert.corp.espn.pvt";
var baseUri = api + "/ec/ncf/event/";
var baseVideoUri = api + "/playvideo/ncf/event/";
var masheryUri = "http://api.espn.com/v1/sports/football/college-football/events/";
var apiKey = "_____";
var dotComUri = "http://espn.go.com/video/clip?id=";
var gamesData = {};
var defaultEmail = '<a href="mailto:matthew.s.schmitz@espn.com">matthew.s.schmitz@espn.com</a>';
var defaultErrorMsg = 'There was an error pulling the data. Please try again later. If the problem persists contact ' + defaultEmail;
var expanded = false;
var publisherClips = new Array();
var videoClips = new Array();
// Color Codes
var highLevel = 60
var midLevel =  30
var lowLevel =  0;
var highColor = 'red';
var midColor = 'orange';
var lowColor = 'green';
// Refresh Variables (in ms)
var defaultInterval = 1000; // 1 second - how often it will determine it needs to look
var lastRefresh = new Date().getTime(); // + 30000; Add 30 seconds from the start so that it doesn't immediately pull
var defaultRefresh = 15000; // 15 seconds - length between refreshes
var isRefreshing = false;
var autoRefresh = true;
var refreshAlert = false;
// State Object For Refreshing
var currentState = {"search" : null,
                    "operator" : null};
// Misc.
//var loadingGif = '<br/><p style="text-align: center"><img src="assets/css/loading.gif" alt="loading"/></p>';
var loadingGif = '<br/><p style="text-align: center"><img src="assets/css/loading.gif" alt="loading"/></p>';


// Genearte Butotn Handlers That Load A Video

function generateLoadHandlers(clips){
    //console.log("generateLoadHandlers");
    $.each(clips, function (k, id) {
        var btnId = "btnViewAbove_" + id;
        $("#"+btnId).click(function() {
            if (videoClips[id] != null){
                var info = videoClips[id];
                var posterImg = info.videoInfo.thumbnailUrl;
                var mp4 = info.videoInfo.mp4Url;
                changeSource(posterImg, mp4, id);
                focusTool("adminPH");
            }
        });
    });
};


// Sort Clips
function sortClips(videos){
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
            console.log("outlier");
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

// Load Clip Stats
function getClipStats(id){
    var stats = 'Video Stats Not Available at This Time.';
    //console.log(id)
    //console.log(videoClips[id])
    if (videoClips[id] != null){
        stats = videoClips[id];
    }
    return stats;
};

// Load Video VideoItem on Click
function changeSource(thumbnail, mp4url, clipId){
    var clipStats = getClipStats(clipId);
    //console.log(clipStats)
    var clipInfo =   '&nbsp;<b>Pub Delay: </b>' + formatMinSec(clipStats.pubDelay, true) + '&nbsp;<b>Tag Delay: </b>' + formatMinSec(clipStats.tagDelay, true) + '&nbsp;<b>Duration: </b>' + formatMinSec(clipStats.duration / 1000) + '&nbsp;<b>Clip Delay: </b>' + formatMinSec(clipStats.tagDelay, true) + '&nbsp;<b>Diff: </b>' + formatMinSec(clipStats.difference, true)  + '<br/>&nbsp;<b>Operator: </b>' + clipStats.operator + '&nbsp;<b>Title:</b>' + clipStats.playText;
    $('#currentVideoStats').html(clipInfo);
    var domElm = this.document.getElementById("currentVideo");
    domElm.src = mp4url;
    domElm.poster = thumbnail;
    domElm.load();
    domElm.click();
    domElm.onclick="";
};


// Sort Publishers
function sortPublishers(a, b) {
    return a > b ? 1 : -1;
};

// Determine Appropriate Course of Action thing to do with null
function isNull(number){
    if (number === null){;
        return true;
    }
    else{
        return false;
    }
}

// Compare Old and New Data for Manual Refresh
function compareData(oldData, newData){
    // check lengths
    if (oldData.length != newData.length){
        return false;
    }
    // check values
    for (var i = 0; i < oldData.length; i++){
        if (oldData[i].toString() != newData[i].toString()){
            return false;
        }
    }
    return true;

};

// Run a function that contains the page's various states and determine if there is new information.
function manualRefresh(){
    //console.log("manualRefresh(start)");
    if (autoRefresh){
        // TODO implement the rest of the refresh properties (if desired)
        if (currentState.hasOwnProperty("search")) {
            if (currentState["search"] != null){
                var currentTime = new Date();
		        currentTime = new Date(currentTime.toUTCString()).getTime()
                var difference = currentTime - lastRefresh;
                if (difference >= defaultRefresh){
                    if (!isRefreshing){
                        // get a new event
                        isRefreshing = true;
                        // get new event
                        var oldData = currentState["search"].data;
                        var uri = currentState["search"].uri;
                        var searchStart = currentState["search"].start;
                        var searchEnd = currentState["search"].end;
                          // prompt user if they want to view the new data | disable the auto-refresh
                        $.ajax(
                            {url: uri,
                            data: {},
                            type: 'get',
                            success: function(newData) {
                                // compare to old
                                isRefreshing = false;
                                lastRefresh = new Date();
                                lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
                                if (!compareData(oldData, newData)){
                   	   		        if (!refreshAlert) {
		                     		    refreshAlert = true;
                                        bootbox.dialog({
	                                        message: "<h4>There is new data to load. Please select an option from below.</h4><i>*Disabling will prevent auto refresh until page reload.</i>",
	                                        title: "<h3>New Data</h3>",
	                                        buttons: {
	                                            success: {
	                                                label: "Refresh",
	                                                className: "btn-success",
	                                                callback: function() {
	                                                    console.log("refresh ")
	                                                    focusTool("search_results_div");
	                                                    clearMessage("search");
	                                                    var startDate = $("#txtReportStart").val(searchStart);
	                                                    var endDate = $("#txtReportEnd").val(searchEnd);
	                                                    // reset the operator
	                                                    var op = $('#ddlOperator').val();
	                                                    var opIndex = document.getElementById("ddlOperator").selectedIndex;
	                                                    var special = {"opIndex" : opIndex, "op" : op};
	                                                    loadSearch(searchStart, searchEnd, special);
	                                                    refreshAlert = false;
	                                                    isRefreshing = false;
	                                                    lastRefresh = new Date();
	                                                    lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
	                                                }
	                                            },
	                                            danger: {
	                                                label: "Disable Auto-Refresh",
	                                                className: "btn-danger",
	                                                callback: function() {
	                                                    console.log("disable ")
	                                                    autoRefresh = false;
	                                                    isRefreshing = false;
	                                                    lastRefresh = new Date();
	                                                    lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
	                                                }
	                                            },
	                                            main: {
	                                                label: "Don't Refresh!",
	                                                className: "btn-primary",
	                                                callback: function() {
	                                                    console.log("ignore ")
	                                                    refreshAlert = false;
	                                                    isRefreshing = false;
	                                                    lastRefresh = new Date();
	                                                    lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
	                                                }
	                                            }
	                                        }
                                        });
			       		            }
                                }
                            },
                            error: function(err){
                                //console.log("error " + err);
                                refreshAlert = false;
                                isRefreshing = false;
                                lastRefresh = new Date();
					            lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
                           	}
                        });
    			    }	       
		        }
            }
        }
    }
    //console.log("manualRefresh(end)");
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
        $('#divNeedsLogin').hide();
        $('#divSearchView').show();
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

function formatMinSec(number, colorCode){
    var min = Math.round(Math.floor(number / 60));
    var sec = Math.round(number - min * 60);
    var color = 'black';
    if (colorCode){
        if (number > highLevel){
            color = highColor;
        }
        else if (midLevel > 30 && number < highLevel){
            color = midColor;
        }
        else{
            color = lowColor;
        }
    }
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
    formattedTime = '<span style="color:' + color + '">' + formattedTime + '</span>';
    return formattedTime;
};

var selectorChanged = function () {
    var op = $('#ddlOperator').val();
    var operatorClips = publisherClips[op];
    loadOperatorClips(op, operatorClips);
};


function loadOperatorClips(operator, clips){
    $('#search_table_results').html('');
    $('#search_results').html('');
    var currentData = new Array();
    var currentClips = new Array();
    var clipsCount = clips.length;
    var opFastest = "unknown";
    var opSlowest = "unknown";
    var opAvgTagDelay = 0;
    var opAvgPubDelay = 0;
    var opAvgDuration = 0;

    $.each(clips, function (k, c) {
        var start = new Date(c.clipEndTime).getTime();
        //var start = new Date(v.transcodeDoneTime).getTime();
        var pubTime = new Date(c.pubTime).getTime();
        var pubDelay = ((pubTime - start) / 1000);
        var tagTime = new Date(c.tagTime).getTime();
        var tagDelay = ((tagTime - start) / 1000);
        opAvgPubDelay += pubDelay;
        opAvgTagDelay += tagDelay;
        if (opFastest == "unknown"){
            opFastest = pubDelay;
        }
        else{
            if (pubDelay < opFastest){
                opFastest = pubDelay;
            }
        }
        // Calculate Games Slowest EC
        if (opSlowest == "unknown"){
            opSlowest = pubDelay;
        }
        else{
            if (pubDelay > opSlowest){
                opSlowest = pubDelay;
            }
        }
        var mp4Uri = dotComUri + c.ceId;
        mp4Uri = '<a href="' + mp4Uri + '" target="_blank">' + c.ceId + '</a>';
        var clipDuration = c.duration;
        var prettyTitle = c.prettyTitle;
        var prettyDate = c.prettyDate;
        opAvgDuration += clipDuration;
        clipDuration = formatMinSec(clipDuration / 1000);
        var currentClip = [mp4Uri, prettyTitle, formatMinSec(pubDelay, true), formatMinSec(tagDelay, true), clipDuration];
        currentClips.push(currentClip);
    });
    // calculations
    opAvgPubDelay = formatMinSec(Math.round(opAvgPubDelay / clipsCount), true);
    opAvgTagDelay = formatMinSec(Math.round(opAvgTagDelay / clipsCount), true);
    opFastest = formatMinSec(opFastest, true);
    opSlowest = formatMinSec(opSlowest, true);
    opAvgDuration = (opAvgDuration / 1000)
    opAvgDuration = formatMinSec(opAvgDuration / clipsCount);
    // table data
    var row = [opAvgPubDelay, opAvgTagDelay, opFastest, opSlowest, opAvgDuration];
    currentData.push(row);
    // data tables  - high level stats
    var tableId = "operator_table_" + operator;
    var tableHeader = '<h4>' + operator  + '</h4>';
    var tableContext= tableHeader  + '<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
    $('#search_table_results').html(tableContext );
    //$("#" + tableId).dataTable().fnDestroy();;
    $("#" + tableId).dataTable( {
        "aaData": currentData,
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": false,
        "bJQueryUI": true,
        "sDom": 'T<"clear">lfrtip',
        "oTableTools": {
            "aButtons": [ "copy", "csv", "xls", "pdf",  "print" ],
            "sSwfPath": "media/swf/copy_csv_xls_pdf.swf"
        },
        "aoColumns": [
            { 'sTitle' : 'Avg. Pub Delay', 'sClass': 'center'},
            { 'sTitle' : 'Avg. Tag Delay', 'sClass': 'center' },
            { 'sTitle' : 'Fastest', 'sClass': 'center' },
            { 'sTitle' : 'Slowest', 'sClass': 'center' },
            { 'sTitle' : 'Avg. Duration', 'sClass': 'center' }
        ]
    } );
    // data tables  - detailed stats
    var tableId = "operator_results_" + operator;
    var tableHeader = '<h4>Clips</h4>';
    var tableContext= tableHeader  + '<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
    $('#search_results').html(tableContext);
    $("#" + tableId).dataTable( {
        "aaData": currentClips,
        "bJQueryUI": true,
        "sDom": 'T<"clear">lfrtip',
        "oTableTools": {
            "aButtons": [ "copy", "csv", "xls", "pdf",  "print" ],
            "sSwfPath": "media/swf/copy_csv_xls_pdf.swf"
        },
        "aoColumns": [
            { "sWidth": "10%", 'sTitle' : 'ceId', 'sClass': 'center'},
            { "sWidth": "60%", 'sTitle' : 'Game', 'sClass': 'center'},
            { "sWidth": "10%", 'sTitle' : 'Clip Delay', 'sClass': 'center'},
            { "sWidth": "10%", 'sTitle' : 'Tag Delay', 'sClass': 'center' },
            { "sWidth": "10%", 'sTitle' : 'Clip Duration', 'sClass': 'center' }
        ]
    } );
};

function loadAdminSearch(start, end){
    $("#divAdminLoading").show();
    console.log("loadAdminSearch(start)");
    if (start == "" &&  end == ""){
        msg = "Start or End must have a value.";
        displayMessage("admin", msg, "error");
        //loadSearchData([]);
        $("#divAdminLoading").hide();
    }
    else{
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
        $.ajax(
            {url: uri,
                data: {},
                type: 'get',
                success: function(data) {
                    //console.log('success');
                    //console.log(data);
                    if (data.length == 0){
                        msg = "No data was found for " + searchDate +  ".";
                        displayMessage("admin", msg, "warning");
                        $('#currentVideoList').html('<p style="text-align: center; color: red;">Search a Date Range to load videos. <br/>(*It will auto-refresh new videos).</p>');
                        $("#divAdminLoading").hide();
                    }
                    else{
                        var publishers = new Array();
                        var currentOperatorClips = new Array();
                        publisherClips =  new Array();
                        var videoList = '';
                        var loadIds = new Array();
                        // CALCULATE OPERATOR STATS
                        var fastest = "unknown";
                        var slowest = "unknown";
                        var avgPubDelay = 0;
                        var avgTagDelay = 0;
                        var avgClipDuration = 0;
                        var ecCount = 0;
                        var masheryHits = 0;
                        var trueClipCount = 0;

                        $.each(data, function (k, c) {
                            // Gather the day's events
                            var eventId = c.dmEventInfo.eventId;
                            var clipId = c.ceId;
                            var publisher = c.publisher;
                            if (c.dmEventInfo.sport != "baseball"){
                                if (publisher != null){
                                    if (publishers.indexOf(publisher.toLowerCase()) == -1){
                                        if (publisher != null){
                                            publishers.push(publisher.toLowerCase());
                                            publisherClips[publisher.toLowerCase()] = new Array();
                                        }
                                    }
                                }
                                var apiUri = masheryUri + eventId +"?apikey=" + apiKey;
                                var prettyTitle = "";
                                var prettyDate = "";
                                var numberOfClips = data.length;
                                $.getJSON(apiUri, function (apiData) {
                                    masheryHits ++;
                                    //console.log("hitting mashery API for ancillary data");
                                    //console.log(apiData);
                                    // Assumuption: Mashery has this data.
                                    // TO-DO:  full error checking or patch as needed.
                                    var eventDate = "";
                                    var start = ""
                                    if (!!apiData.sports[0].leagues[0].events[0].date){
                                        eventDate = apiData.sports[0].leagues[0].events[0].date;
                                        start = ' @ '  + '<span style="color:black">'+ eventDate + '</span>';
                                    }
                                    var vs =  '<span style="color:black"> vs. </span>';
                                    var competitors = apiData.sports[0].leagues[0].events[0].competitions[0].competitors;
                                    var home = competitors[0].team;
                                    var homeCol = home.color;
                                    var homeString  = home.nickname + " " + home.name;;
                                    var away = competitors[1].team;
                                    var awayCol = away['color'];
                                    var awayString = away.nickname + " " + away.name;
                                    var awaySpanPretty = '<span  style="color:#' + awayCol  + '">' + awayString + '</span>';
                                    var homeSpanPretty = '<span style="color:#' + homeCol  + '">' + homeString + ' </span>';
                                    prettyTitle = awaySpanPretty + vs + homeSpanPretty;
                                    prettyDate = start;
                                    c.prettyTitle = prettyTitle;
                                    c.prettyDate = prettyDate;
                                    if (c.source == "eventclipper"){
                                        //verify it is valid data before adding it
                                        if(!isNull(c.clipEndTime) && !isNull(c.pubTime) && !isNull(c.tagTime && !isNull(c.ceId))){
                                            var start = new Date(c.clipEndTime).getTime();
                                            var pubTime = new Date(c.pubTime).getTime();
                                            var pubDelay = ((pubTime - start) / 1000);
                                            var tagTime = new Date(c.tagTime).getTime();
                                            var tagDelay = ((tagTime - start) / 1000);
                                            // Add
                                            videoClips[c.ceId] = {"pubDelay" :  pubDelay, "tagDelay" : tagDelay, "duration" : c.duration, "operator" : c.publisher};
                                            //var start = new Date(v.transcodeDoneTime).getTime();
                                            avgPubDelay += pubDelay;
                                            avgTagDelay += tagDelay;
                                            avgClipDuration += c.duration;
                                            if (fastest == "unknown"){
                                                fastest = pubDelay;
                                            }
                                            else{
                                                if (pubDelay < fastest){
                                                    fastest = pubDelay;
                                                }
                                            }
                                            // Calculate Games Slowest EC
                                            if (slowest == "unknown"){
                                                slowest = pubDelay;
                                            }
                                            else{
                                                if (pubDelay > slowest){
                                                    slowest = pubDelay;
                                                }
                                            }
                                            ecCount ++;
                                            publisherClips[publisher.toLowerCase()].push(c);
                                            trueClipCount ++;
                                        }
                                    }

                                    if (numberOfClips <= masheryHits){
                                        // calculations
                                        avgPubDelay = formatMinSec(Math.round(avgPubDelay / ecCount));
                                        avgTagDelay = formatMinSec(Math.round(avgTagDelay / ecCount));
                                        avgClipDuration = formatMinSec(Math.round(( avgClipDuration / 1000) / numberOfClips))
                                        // load game stats
                                        var gameStats = "<table><tbody>";

                                        // I care about the clip delay and the tag delay to critique my people. That would be awesome if I could see the average for the game, along with maybe the fastest and slowest clips.
                                        // Will add fastest, slowest, and average.
                                        var gameFastest = formatMinSec(fastest);
                                        var gameSlowest = formatMinSec(slowest);
                                        gameStats += '<tr><td><b>Avg. Pub: </b></td><td>' + avgPubDelay + '</td></tr>';
                                        gameStats += '<tr><td><b>Avg. Tag: </b></td><td>' + avgTagDelay + '</td></tr>';
                                        gameStats += '<tr><td><b>Fastest: </b></td><td>' + gameFastest + '</td></tr>';
                                        gameStats += '<tr><td><b>Slowest: </b></td><td>' + gameSlowest + '</td></tr>';
                                        gameStats += '<tr><td><b>Avg. Dur: </b></td><td>' + avgClipDuration + '</td></tr></tbody></table>';
                                        $("#dviGameStatsInfo").html(gameStats);
                                        // TODO - populate video list
                                        //var videoList = ''; // ''<p style="text-align: center; color: red;">Video List</p>';

                                        // <img src="assets/css/loading.gif" alt="loading"/>
                                        // var gridDisplay = '<video width="'+ videoGridWidth +'" height="'+ videoGridHeight + '" controls poster="' + vl.thumbnailUrl + '" onclick="changeSource(this, ' + "'" + vl.mp4Url  + "'" + ')" ></video>';
                                        /*var videoListItemHeight = '150';
                                        var videoListItemWidth = '255';
                                        var videoItemDate = '<p style="text-align: center; padding-left: 5px; padding-right: 5px;">10/13/2013 @ 04:45:01</p>'
                                        var posterImg =  'http://brsweb.video-origin.espn.com/images/2013/1010/evc_20131010_Rutgers_vs_Louisville_157419/evc_20131010_Rutgers_vs_Louisville_157419.jpg';
                                        var mp4 = 'http://brsweb.video-origin.espn.com/motion/2013/1010/evc_20131010_Rutgers_vs_Louisville_157419/evc_20131010_Rutgers_vs_Louisville_157419.mp4';
                                        var playText = 'Senorise Perry rush for 13 yards to the Rutgr 26 for a 1ST down.';
                                        var videoItemHeader = '<p style="text-align: center;  padding-left: 5px; padding-right: 5px;">' + playText + '</p>'
                                        var videoStats = {"playText": playText,
                                                          "eventClipperOutTime": videoItemDate};
                                        //var videoItem = videoItemHeader + '<img src="' + posterImg + '" alt="' + playText + '" height="' + videoListItemHeight +'" width="' + videoListItemWidth + '" style="margin-left: 20px;" onclick="changeSource(' + "'" + posterImg  + "', " + "'" + mp4  + "', "  + "'" + videoStats  + "'" + ')"/>' + videoItemDate + '<hr>';
                                        var videoItem = videoItemHeader + '<img src="' + posterImg + '" alt="' + playText + '" height="' + videoListItemHeight +'" width="' + videoListItemWidth + '" style="margin-left: 20px;" onclick="changeSource(' + "'" + posterImg  + "', " + "'" + mp4  + "', "  + "'" + clipId  + "'" + ')"/>' + videoItemDate + '<hr>';
                                        videoList += videoItem;
                                        videoList += videoItem;
                                        videoList += videoItem;
                                        videoList += videoItem;
                                         $('#currentVideoList').html(videoList);     */
                                        var processedEvents = 0;
                                        var processedData = 0;
                                        var processedClips = 0;
                                        //var uri  = '/search' + longDate;
                                        var videoListItemHeight = '150';
                                        var videoListItemWidth = '255';
                                        var uri = api + '/eventvideo' + longDate;
                                        $.ajax(
                                            {url: uri,
                                            data: {},
                                            type: 'get',
                                            success: function(videoData) {
                                                console.log("success videoData");
                                                // compare to old
                                                $.each(videoData, function (k, vl) {
                                                    var videos = vl.playVideoList;
                                                    console.log("processing videos");
                                                    $.each(videoData, function (vk, vid) {
                                                        var clipVideos = vid.playVideoList;
                                                        $.each(clipVideos, function (k, cl) {
                                                            //console.log("processing clips");
                                                            var clips = cl.videoList;
                                                            //if (clips != null && typeof clips != "undefined"){
                                                            $.each(clips, function (k, ce) {
                                                                var clId = ce.ceId;
                                                                //console.log(clId)
                                                                //console.log("processing clip " + clId);
                                                                var sortedVideos = sortClips(clips);
                                                                // get a baseline
                                                                var firstVideo = sortedVideos[0];
                                                                var lit = new Date(firstVideo.publishedDate).getTime();
                                                                // TODO Calc - Provider Delay | Latency
                                                                if (videoClips[clId] != null){
                                                                    var newObject = videoClips[clId];
                                                                    newObject["videoInfo"] = ce;
                                                                    videoClips[clId] = newObject;
                                                                    var posterImg = ce.thumbnailUrl;
                                                                    // TODO - fix video item date
                                                                    var belowVideo = '<p style="text-align: center; padding-left: 5px; padding-right: 5px;">' + ce.publishedDate + '&nbsp;<b>by</b>&nbsp;' + newObject.operator + '</p>';
                                                                    var mp4 = ce.mp4Url;
                                                                    // TODO - replace vid playId with link
                                                                    var playText = "";
                                                                    var altText = "";
                                                                    var playLink ='<a href="' + mp4 + '" target="_blank">' + clId + '</a>';
                                                                    if (!!cl.playText){
                                                                        playText = cl.playText + '(' + playLink + ')';
                                                                        altText = cl.playText + '(' + clId + ')';
                                                                    }
                                                                    else{
                                                                        playText = playLink;
                                                                        altText = clId;
                                                                    }
                                                                    var clipTime = new Date(ce.publishedDate).getTime();
                                                                    //console.log("clipTime " + clipTime)
                                                                    var difference = ((clipTime - lit) / 1000);
                                                                    if (difference < 0){
                                                                        difference= 0;
                                                                    }
                                                                    newObject["playText"] = playText;
                                                                    //console.log("difference " + difference)
                                                                    newObject["difference"] = difference;
                                                                    videoClips[clId] = newObject;
                                                                    var videoItemHeader = '<p style="text-align: center;  padding-left: 5px; padding-right: 5px;">' + playText + '</p>'
                                                                    var videoItem = videoItemHeader + '<img src="' + posterImg + '" alt="' + altText  + '" height="' + videoListItemHeight +'" width="' + videoListItemWidth + '" style="margin-left: 20px;" onclick="changeSource(' + "'" + posterImg  + "', " + "'" + mp4  + "', "  + "'" + clId  + "'" + ')"/>' + belowVideo + '<hr>';
                                                                    videoList += videoItem;
                                                                    var mp4Uri = dotComUri + clId;
                                                                    mp4Uri = '<a href="' + mp4Uri + '" target="_blank">' + clId + '</a>';
                                                                    var clipDuration = c.duration;
                                                                    var prettyTitle = "balank bs bnlank";//c.prettyTitle;
                                                                    var prettyDate = "10/24/25";//c.prettyDate;
                                                                    var btnId = "btnViewAbove_" + clId;
                                                                    loadIds.push(clId)
                                                                    var viewAbove = '<button id="' + btnId + '" class="btn btn-mini btn-info">Load</button>';
                                                                    var currentClip = [mp4Uri, newObject.operator, altText , formatMinSec(newObject.pubDelay, true), formatMinSec(newObject.tagDelay, true), formatMinSec(difference, true), formatMinSec(newObject.duration / 1000), viewAbove];
                                                                    currentOperatorClips.push(currentClip);
                                                                }
                                                                processedClips ++;
                                                                if (processedClips >= clips.length){
                                                                    console.log("processedData " + processedData)
                                                                    processedClips = 0;
                                                                    processedData ++;
                                                                }
                                                            });
                                                            if (processedData >= clipVideos.length){
                                                                console.log("processedEvents " + processedEvents)
                                                                processedData = 0;
                                                                processedEvents ++;
                                                            }
                                                            //}
                                                        });
                                                        /*console.log("processedEach " + processedEach)
                                                        console.log("playVideoList " + videoData.length)*/
                                                        if(processedEvents >= videoData.length){
                                                            // add data to bottom table
                                                            console.log("only load me once")


                                                            // data tables  - high level stats
                                                            var tableId = "admin_table_results_dt";
                                                            var tableHeader = '<h4>Clip Results</h4>';
                                                            var tableContext= tableHeader  + '<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
                                                            $('#admin_table_results').html(tableContext );
                                                            $("#" + tableId).dataTable( {
                                                                "aaData": currentOperatorClips,
                                                                "bJQueryUI": true,
                                                                "sDom": 'T<"clear">lfrtip',
                                                                "oTableTools": {
                                                                    "aButtons": [ "copy", "csv", "xls", "pdf",  "print" ],
                                                                    "sSwfPath": "media/swf/copy_csv_xls_pdf.swf"
                                                                },
                                                                "aoColumns": [
                                                                    { "sWidth": "7%", 'sTitle' : 'ceId', 'sClass': 'center'},
                                                                    { "sWidth": "10%", 'sTitle' : 'Operator', 'sClass': 'center'},
                                                                    { "sWidth": "50%", 'sTitle' : 'Play Text', 'sClass': 'center'},
                                                                    { "sWidth": "7%", 'sTitle' : 'Clip Delay', 'sClass': 'center'},
                                                                    { "sWidth": "7%", 'sTitle' : 'Tag Delay', 'sClass': 'center' },
                                                                    { "sWidth": "7%", 'sTitle' : 'Diff', 'sClass': 'center' },
                                                                    { "sWidth": "7%", 'sTitle' : 'Clip Duration', 'sClass': 'center' }   ,
                                                                    { "sWidth": "5%", 'sTitle' : 'Load', 'sClass': 'center' }
                                                                ]
                                                            } );
                                                            // generate button load handlers
                                                            generateLoadHandlers(loadIds);
                                                            // rest of content
                                                            $('#currentVideoList').html(videoList);
                                                            msg = 'Data found for "' + searchDate + '" => "' + trueClipCount +  '" Total Clips by "' + publishers.length + '" operators.<br/>';
                                                            displayMessage("admin", msg, "success");
                                                            $("#popUpDiv").show();
                                                            $("#divAdminLoading").hide();
                                                        }
                                                    });
                                                });

                                            },
                                            error: function(err){
                                                msg = '<b>Error </b> Bad Video Data Request - Invalid Timestamp <br/>';
                                                displayMessage("admin", msg, "error");
                                                $('#currentVideoList').html('<p style="text-align: center; color: red;">Search a Date Range to load videos. <br/>(*It will auto-refresh new videos).</p>');
                                                $("#divAdminLoading").hide();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }

                },
                error: function(err){
                    msg = '<b>Error </b> Bad Request - Invalid Timestamp <br/>';
                    displayMessage("admin", msg, "error");
                    $('#currentVideoList').html('<p style="text-align: center; color: red;">Search a Date Range to load videos. <br/>(*It will auto-refresh new videos).</p>');
                    $("#divAdminLoading").hide();
                }
        });
    }
    console.log("loadAdminSearch(end)");
};

var loadSearch = function (start, end, special){
    var reportObj = { "start" : start, "end": end};
    $("#reportId").html(String(reportObj));
    console.log("loadSearch(start)");
    var searchStart = new Date().getTime();
    var startDate = start;
    var endDate = end;
    clearMessage("search");
    $('#ddlOperator').empty();
    $('#ddlOperator').append('<option value="">...Operators Loading</option>');
    $("#dviGameStatsInfo").html('');
    $("#divSearchLoading").show();
    $("#search_results_div").show();
    $('#search_table_results').html('');
    $('#search_results').html('');
    $('#report_table').html("" );
    $("#reporting_results").html("");
    $('#report_results_table').html("" );
    //var uri  = '/search?date=' + date;
    if (start == "" &&  end == ""){
        msg = "Start or End must have a value.";
        displayMessage("search", msg, "error");
        //loadSearchData([]);
        $("#divSearchLoading").hide();
    }
    else{
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
        $.ajax(
            {url: uri,
            data: {},
            type: 'get',
            success: function(data) {
                currentState.search =  { "uri" : uri, "data": data,  "start" : start, "end": end};;
                var msg = "";
                //console.log(data);
                if (data.length == 0){
                    var dateSearch = ""
                    msg = "No data was found for " + searchDate +  ".";
                    displayMessage("search", msg, "error");
                    $("#divSearchLoading").hide()
                }
                else{
                    var publishers = new Array();
                    publisherClips =  new Array();

                    var fastest = "unknown";
                    var slowest = "unknown";
                    var avgPubDelay = 0;
                    var avgTagDelay = 0;
                    var ecCount = 0;
                    var masheryHits = 0;
                    var trueClipCount = 0;

                    $.each(data, function (k, c) {
                        // Gather the day's events
                        var eventId = c.dmEventInfo.eventId;
                        var clipId = c.ceId;
                        var publisher = c.publisher;
                        if (c.dmEventInfo.sport != "baseball"){
                            if (publisher != null){
                                if (publishers.indexOf(publisher.toLowerCase()) == -1){
                                    if (publisher != null){
                                        publishers.push(publisher.toLowerCase());
                                        publisherClips[publisher.toLowerCase()] = new Array();
                                    }
                                }
                            }
                            var apiUri = masheryUri + eventId +"?apikey=" + apiKey;
                            var prettyTitle = "";
                            var prettyDate = "";
                            var numberOfClips = data.length;
                            $.getJSON(apiUri, function (apiData) {
                                masheryHits ++;
                                //console.log("hitting mashery API for ancillary data");
                                //console.log(apiData);
                                // Assumuption: Mashery has this data.
                                // TO-DO:  full error checking or patch as needed.
                                var eventDate = "";
                                var start = ""
                                if (!!apiData.sports[0].leagues[0].events[0].date){
                                    eventDate = apiData.sports[0].leagues[0].events[0].date;
                                    start = ' @ '  + '<span style="color:black">'+ eventDate + '</span>';
                                }
                                var vs =  '<span style="color:black"> vs. </span>';
                                var competitors = apiData.sports[0].leagues[0].events[0].competitions[0].competitors;
                                var home = competitors[0].team;
                                var homeCol = home.color;
                                var homeString  = home.nickname + " " + home.name;;
                                var away = competitors[1].team;
                                var awayCol = away['color'];
                                var awayString = away.nickname + " " + away.name;
                                var awaySpanPretty = '<span  style="color:#' + awayCol  + '">' + awayString + '</span>';
                                var homeSpanPretty = '<span style="color:#' + homeCol  + '">' + homeString + ' </span>';
                                prettyTitle = awaySpanPretty + vs + homeSpanPretty;
                                prettyDate = start;
                                c.prettyTitle = prettyTitle;
                                c.prettyDate = prettyDate;
                                if (c.source == "eventclipper"){
                                    //verify it is valid data before adding it
                                    if(!isNull(c.clipEndTime) && !isNull(c.pubTime) && !isNull(c.tagTime && !isNull(c.ceId))){
                                        var start = new Date(c.clipEndTime).getTime();
                                        var pubTime = new Date(c.pubTime).getTime();
                                        var pubDelay = ((pubTime - start) / 1000);
                                        var tagTime = new Date(c.tagTime).getTime();
                                        var tagDelay = ((tagTime - start) / 1000);
                                        //var start = new Date(v.transcodeDoneTime).getTime();
                                        avgPubDelay += pubDelay;
                                        avgTagDelay += tagDelay;
                                        if (fastest == "unknown"){
                                            fastest = pubDelay;
                                        }
                                        else{
                                            if (pubDelay < fastest){
                                                fastest = pubDelay;
                                            }
                                        }
                                        // Calculate Games Slowest EC
                                        if (slowest == "unknown"){
                                            slowest = pubDelay;
                                        }
                                        else{
                                            if (pubDelay > slowest){
                                                slowest = pubDelay;
                                            }
                                        }
                                        ecCount ++;
                                        publisherClips[publisher.toLowerCase()].push(c);
                                        trueClipCount ++;
                                    }
                                }
                                if (numberOfClips <= masheryHits){
                                    // calculations
                                    avgPubDelay = formatMinSec(Math.round(avgPubDelay / ecCount));
                                    avgTagDelay = formatMinSec(Math.round(avgTagDelay / ecCount));
                                    //console.log(publishers);
                                    $('#ddlOperator').empty();
                                    $('#ddlOperator').append('<option value="">Select Operator</option>');
                                    // alphabetize operators
                                    publishers.sort(sortPublishers);
                                    $.each(publishers, function (k, p) {
                                        $('#ddlOperator').append('<option value="' + p + '">' + p + '</option>');
                                    });
                                    msg = 'Data found for "' + searchDate + '" => "' + trueClipCount +  '" Total Clips by "' + publishers.length + '" operators.<br/>';
                                    //msg = 'Data found for "' + searchDate + '" => "' + publishers.length + '" operators.<br/>';
                                    displayMessage("search", msg, "success");
                                    // load game stats
                                    var gameStats = "<table><tbody>";
                                    // I care about the clip delay and the tag delay to critique my people. That would be awesome if I could see the average for the game, along with maybe the fastest and slowest clips.
                                    // Will add fastest, slowest, and average.
                                    var gameFastest = formatMinSec(fastest);
                                    var gameSlowest = formatMinSec(slowest);
                                    gameStats += '<tr><td><b>Avg. Pub: </b></td><td>' + avgPubDelay + '</td></tr>';
                                    gameStats += '<tr><td><b>Avg. Tag: </b></td><td>' + avgTagDelay + '</td></tr>';
                                    gameStats += '<tr><td><b>Fastest: </b></td><td>' + gameFastest + '</td></tr>';
                                    gameStats += '<tr><td><b>Slowest: </b></td><td>' + gameSlowest + '</td></tr></tbody></table>';
                                    $("#dviGameStatsInfo").html(gameStats);
                                    // Used to Manual Refresh the View
                                    if (special != null){
                                        var op = special.op;
                                        var opIndex = special.opIndex;
                                        var operatorClips = publisherClips[op];
                                        document.getElementById("ddlOperator").options[opIndex].selected = true;
                                        loadOperatorClips(op, operatorClips);
                                    }
                                    $("#popUpDiv").show();
                                    $("#divSearchLoading").hide();
                                }
                            });
                        }
                    });
                }
            },
            error: function(err){
                msg = '<b>Error </b> Bad Request - Invalid Timestamp <br/>';
                //msg = 'Data found for "' + searchDate + '" => "' + publishers.length + '" operators.<br/>';
                displayMessage("search", msg, "error");
                $("#divSearchLoading").hide();
            }
        });
    }
    console.log("loadSearch(end)");
};

function initPage() {
    console.log("Initialize Page Start");

    // Check Login Status
    checkLoginStatus();

    // Initialize Datepicker
    var today = timeNow().toString().substr(0, 10);
    today = today.replace("-", "");
    today = today.replace("-", "");

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


    $("#txtAdminStart").datepicker({
        showOn: 'button',
        buttonImageOnly:true,
        buttonImage:'icon_cal.png',
        dateFormat:'yymmdd' });


    $("#txtAdminEnd").datepicker({
        showOn: 'button',
        buttonImageOnly:true,
        buttonImage:'icon_cal.png',
        dateFormat:'yymmdd' });

    $("#txtReportStart").val(today);
    $("#txtReportEnd").val(today);
    $("#txtAdminStart").val(today);
    $("#txtAdminEnd").val(today);

    // Every X Seconds Refresh the Page ~Manually~
    setInterval(function(){
        manualRefresh();
    }, defaultInterval);
    console.log("Initialize Page End");

    // on ddl change
    $('#ddlOperator').change(selectorChanged);

};


var getSearch = function(callback){
    navigator.geolocation.getCurrentPosition(function(pos){
        succesfull(pos);
        typeof callback === 'function' && callback(geoloc);
    }, function(){
        alert("fail");
    });
};

$(document).ready(function (e) {
    // Load UI(s)/Data
    initPage();

    $('#btnSearch').click(function () {
        focusTool("search_results_div");
        clearMessage("search");
        var startDate = $("#txtReportStart").val();
        var endDate = $("#txtReportEnd").val();
        loadSearch(startDate, endDate);
    });

    // Clear the Report Dates and Refocus the page view
    $('#btnResetSearch').click(function () {
        focusTool("search_results_div");
        clearMessage("search");
        $('#report_table').html("" );
        $('#report_results_table').html("" );
        var today = timeNow().toString().substr(0, 10);
        today = today.replace("-", "");
        today = today.replace("-", "");
        $("#txtReportStart").val(today);
        $("#txtReportEnd").val(today);
    });

    // Search Key
    $('#btnSearchKey').click(function () {
        var keyInfo = '<h3>Search Key</h3><h4>Table Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Avg. Pub Delay </td><td>The average time it took to publish a clip..</td></tr>';
        keyInfo += '<tr><td>Avg. Tag Delay </td><td>The average time it took to tag a.</td></tr>';
        keyInfo += '<tr><td>Fastest </td><td>Fastest</td></tr>';
        keyInfo += '<tr><td>Slowest </td><td>Slowest</td></tr>';
        keyInfo += '<tr><td>Avg. Duration </td><td>The average clip duration. Example: minutes:seconds  | mm:ss .</td></tr></tbody></table>';
        keyInfo += '<h4>Clips Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>ceId </td><td>Clip ID. Clicking it will open the video on "dot-com".</td></tr>';
        keyInfo += '<tr><td>Game </td><td>The game title for the clip.</td></tr>';
        keyInfo += '<tr><td>Clip Delay </td><td>The time it took to publish the clip. (end-to-end delay)</td></tr>';
        keyInfo += '<tr><td>Tag Delay </td><td>The time it took to tag the clip.</td></tr>';
        keyInfo += '<tr><td>Clip Duration </td><td>The clip duration.</td></tr>';
        keyInfo += '<tr><td>&nbsp;</td><td><b>Color Guide</b></td></tr>';
        keyInfo += '<tr><td><span style="color:green">(+x) </td><td>less than 30 seconds</td></tr>';
        keyInfo += '<tr><td><span style="color:orange">(+x)</td><td>between 30 - 60 seconds</td></tr>';
        keyInfo += '<tr><td><span style="color:red">(+x)</td><td>more than 60 seconds</td></tr></tbody></table>';
        bootbox.alert(keyInfo, function() {});

    });

    $('#btnAdminSearch').click(function () {
        focusTool("adminSection");
        clearMessage("admin");
        var startDate = $("#txtAdminStart").val();
        var endDate = $("#txtAdminEnd").val();
        $('#currentVideoList').html(loadingGif);
        loadAdminSearch(startDate, endDate);
    });

    // Clear the Report Dates and Refocus the page view
    $('#btnAdminResetSearch').click(function () {
        focusTool("adminSection");
        clearMessage("admin");
        $('#admin_table').html("");
        $('#admin_results_table').html("");
        $('#currentVideoList').html('<p style="text-align: center; color: red;">Search a Date Range to load videos. <br/>(*It will auto-refresh new videos).</p>');
        var today = timeNow().toString().substr(0, 10);
        today = today.replace("-", "");
        today = today.replace("-", "");
        $("#txtAdminStart").val(today);
        $("#txtAdminEnd").val(today);
    });

    // Admin Search Key
    $('#btnAdminSearchKey').click(function () {
        var keyInfo = '<h3>Admin Search Key</h3><h4>Table Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Avg. Pub Delay </td><td>The average time it took to publish a clip..</td></tr>';
        keyInfo += '<tr><td>Avg. Tag Delay </td><td>The average time it took to tag a.</td></tr>';
        keyInfo += '<tr><td>Fastest </td><td>Fastest</td></tr>';
        keyInfo += '<tr><td>Slowest </td><td>Slowest</td></tr>';
        keyInfo += '<tr><td>Avg. Duration </td><td>The average clip duration. Example: minutes:seconds  | mm:ss .</td></tr></tbody></table>';
        keyInfo += '<h4>Clips Key</h4><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>ceId </td><td>Clip ID. Clicking it will open the video on "dot-com".</td></tr>';
        keyInfo += '<tr><td>Game </td><td>The game title for the clip.</td></tr>';
        keyInfo += '<tr><td>Clip Delay </td><td>The time it took to publish the clip. (end-to-end delay)</td></tr>';
        keyInfo += '<tr><td>Tag Delay </td><td>The time it took to tag the clip.</td></tr>';
        keyInfo += '<tr><td>Clip Duration </td><td>The clip duration.</td></tr>';
        keyInfo += '<tr><td>&nbsp;</td><td><b>Color Guide</b></td></tr>';
        keyInfo += '<tr><td><span style="color:green">(+x) </td><td>less than 30 seconds</td></tr>';
        keyInfo += '<tr><td><span style="color:orange">(+x)</td><td>between 30 - 60 seconds</td></tr>';
        keyInfo += '<tr><td><span style="color:red">(+x)</td><td>more than 60 seconds</td></tr></tbody></table>';
        bootbox.alert(keyInfo, function() {});

    });


    // User Information  - Logout
    $('#btnLogout').click(function (e) {
        delCookie("username");
        e.preventDefault();
        $('#divLogout').hide();
        $('#btnUserInfo').html("Logging");
        $('#divLogin').show();
        $('#divNeedsLogin').show();
        $('#divSearchView').hide();
        return false;
    });

    // User Information  - Logout
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
            $('#divNeedsLogin').hide();
            $('#divSearchView').show();
        }
    });


    // Game / Interval Stats Pop-Up
    $('#hidePopUp').click(function () {
        $('#popUpDiv').hide();
    });

    $('#btnEmbeddedPopUp').click(function () {
        $('#popUpDiv').show();
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
