// Global Variables
var api = "http://api.cert.corp.espn.pvt";
var masheryUri = "http://api.espn.com/v1/sports/football/college-football/events/";
var apiKey = "_____";
var gamesData = {};
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
var currentState = {"event" : null,
                    "play" : null,
                    "report" : null};
// Video Colors
var mlbamTdColor = 'PeachPuff';
var ecTdColor = 'LightBlue';
var lcTdColor = 'LightYellow';

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

// Login Functions
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

// Run a function that contains the page's various states and determine if there is new information.
function manualRefresh(){
    if (autoRefresh){
        // TODO implement the rest of the refresh properties (if desired)
        if (currentState.hasOwnProperty("event")) {
            if (currentState["event"] != null){
                // determine if a refresh is necessary
                var currentTime = new Date();
                currentTime = new Date(currentTime.toUTCString()).getTime();
                var difference = currentTime - lastRefresh;
		        if (difference >= defaultRefresh){
                    if (!isRefreshing){
                        // get a new event
                        isRefreshing = true;
                        var oldData = currentState["event"].data;
                        var uri = currentState["event"].uri;
                        var eventId = currentState["event"].id;
                        $.ajax({
                            url: uri,
                            data: {},
                            type: 'get',
                            success: function(newData) {
                                isRefreshing = false;
                                lastRefresh = new Date();
                                lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
                                // compare to old
                                //oldData.push("baddata"); //test comparison method
                                if (!compareData(oldData, newData)){
                                    // prompt user if they want to view the new data | disable the auto-refresh
                                    if (!refreshAlert) {
                                        refreshAlert = true;
                                        bootbox.dialog({
                                            message: "<h4>There is new data to load. Please select an option from below.</h4><i>*Disabling will prevent auto refresh until page reload.</i>",
                                            title: "<h3>New Event Viewer Data</h3>",
                                            buttons: {
                                                success: {
                                                    label: "Refresh",
                                                    className: "btn-success",
                                                    callback: function() {
                                                        loadEvent(eventId, 101)
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
                                                        refreshAlert = false;
                                                        isRefreshing = false;
                                                        lastRefresh = new Date();
                                                        lastRefresh = new Date(lastRefresh.toUTCString()).getTime();
                                                    }
                                                }
                                            }
                                        }
                                        );
                                    }
                                }
                            },
                            error: function(err){
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

// Generate Handlers for Loading an event's Event Viewer
function generateHandlers(events){
    $.each(events, function (k, id) {
        var btnId = "btnEvent_" + id;
        $("#"+btnId).click(function() {
            loadEvent(id);
        });
    });
};

// Format a Given Time into Minutes:Seconds | Example: mm:ss / 15:39
function formatMinSec(number, colorCode){
    var min = Math.round(Math.floor(number / 60));
    var sec = Math.round(number - min * 60);
    var color = 'black';
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
        formattedTime = '<span style="color:' + color + '">(+' + formattedTime + ')</span>';
    }
    return formattedTime;
};

// Rewrite 10/14/2013
// Load Full Search Table Event Data
function loadFullSearchTableData(currentData){
    var tableId = "ful_search_table";
    var tableContext='<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
    //var newTable = eventHeader + tableContext + '<br/><br/>';
    $("#full_search_table_results").html(tableContext);
    $("#" + tableId).dataTable( {
        "aaData": currentData,
        "aaSorting": [ [4,'desc'] ],
        "bPaginate": false,
        "bLengthChange": false,
        "bFilter": false,
        "bJQueryUI": true,
        "sDom": '<"H"Cfr>t<"F"ip>',
        "aoColumns": [
            { 'sTitle' : 'Game', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
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

//
function loadDate(date){
    try{
        console.log("loadDate(start)");
        $("#divSearchLoading").show();
        $("#search_results_div").show();
        $("#search_table_results").html("");
        clearMessage("search");
        var searchUri  = api + '/ec?end=' + date;
        var searchMsg = "";
        //console.log(searchUri);
        $.ajax(
            {url: searchUri,
            data: {},
            type: 'get',
            success: function(searchData) {
                var count = 0;
                $.getJSON(apiUri, function (apiData) {
                    var eventDate = "";
                    var start = ""
                        ecDuration = formatMinSec((ecDuration / 1000) / ecCount);

                        // Final Data Scrubbing
                        var dtMlbamRow = [ "MLBAM" , mlbamCount, mlbamFirst, mlbamAvgLat, mlbamAvgDiff, mlbamPert, mlbamDuration];
//                                var dtEcRow = [ "EventClipper" , ecCount, ecFirst, ecAvgLat, ecAvgDiff, ecPert, ecDuration];
//                                var dtLcRow = [ "LiveClips" , lcCount, lcFirst, lcAvgLat, lcAvgDiff, lcPert, lcDuration];
//                                var eventUrl = hostUrl + '?eventId=' + eventId;
//                                var eventLink ='<a href="' + eventUrl + '"><i class="icon-share"></i>&nbsp;Share Event</a>';
//                                var eventEmail ='&nbsp;| <a href="mailto: ?subject=' + emailSubject + '&body=View this event ' + eventUrl  + '"><i class="icon-envelope"></i>&nbsp;Email</a>';
//                                var event_viewer_header = eventTitle + '<a href="'+ eventUri +'" target="_blank">EC Endpoint</a>&nbsp;|&nbsp;' + '<a href="'+ eventVideoUri +'" target="_blank">EC Video Endpoint</a><br/> <i>Number of Milestones (' +  numberOfVideos + ' in Total):</i>&nbsp;' + eventLink + eventEmail + '<br/>';
//                                var dtTblId = "tbl_" + eventId;
//                                var dtEventData = [ dtEcRow, dtLcRow, dtMlbamRow];

                    loadSearchTableData(dtEventData , dtTblId, event_viewer_header);
                    if (count >= events.length){
                        msg = "Data found for '" + date + "' => " + events.length + " events.";
                        displayMessage("search", msg, "success");
                        // Full Date Search
                        // loadFullSearchTableData(fullEventsTable);
                        // generate button handlers
                        generateHandlers(events);
                        $("#divSearchLoading").hide()
                    }
                });
            },
            error: function(err){
                msg = '<b>Error </b> Bad Request - Invalid Timestamp <br/>';
                //msg = 'Data found for "' + searchDate + '" => "' + publishers.length + '" operators.<br/>';
                displayMessage("search", msg, "error");
                $("#divSearchLoading").hide();
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
    // checkLoginStatus();

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

    // Initialize Search Text-Boxes to Today
    var today = timeNow().toString().substr(0, 10);
    today = today.replace("-", "");
    today = today.replace("-", "");
    $("#txtReportStart").val(today);
    $("#txtReportEnd").val(today);

    // Parase URI Parameter for "deep linking"
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });

    // report link
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

    // event / play link
    if (!!vars.eventId){
        var playId =  0;
        if (!!vars.playId){
            playId = vars.playId;
        }
        loadEvent(vars.eventId, playId);
    }

    // Every X Seconds Refresh the Page ~Manually~
//    setInterval(function(){
//        manualRefresh();
//    }, defaultInterval);

    console.log("Initialize Page End");
};

$(document).ready(function (e) {
    // Load UI(s)/Data
    initPage();

    // Load Today into the Search
    $('#btnSearchToday').click(function () {
        var today = timeNow().toString().substr(0, 10);
        today = today.replace("-", "");
        today = today.replace("-", "");
        $("#txtSearch").val(today);
    });

    // Search a Date for its Events
    $('#btnSearch').click(function () {
        focusTool("searchSection");
        clearMessage("search");
        var searchDate = $("#txtSearch").val();
        loadDate(searchDate);
    });

    // Generate a Report
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

    // User Information - Logout
    $('#btnLogout').click(function (e) {
        delCookie("username");
        e.preventDefault();
        $('#divLogout').hide();
        $('#feedbackLink').hide();
        $('#btnUserInfo').html("Logging");
        $('#divLogin').show();
        return false;
    });

    // User Information - Login
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
            setCookie("username",uname,1);
            $('#txtUname').val("");
            $('#txtPword').val("");
            $('#divLogin').hide();
            $('#btnUserInfo').html(getCookie("username"));
            $('#divLogout').show();
            $('#feedbackLink').show();
        }
    });

    // Button Linking
    $('#btnSearchLink').click(function () {
        focusTool("searchSection");
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
