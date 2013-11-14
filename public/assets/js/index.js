// Global Variables
var api = "http://api.cert.corp.espn.pvt";
//var masheryUri = "http://api.espn.com/v1/sports/football/college-football/events/";
//var apiKey = "_____";
var gamesData = {};
// Color Codes
var highLevel = 10
var midLevel =  5
var lowLevel =  1;
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
//var mlbamTdColor = 'PeachPuff';
//var ecTdColor = 'LightBlue';
//var lcTdColor = 'LightYellow';
// Misc.
var loadingGif = '<br/><p style="text-align: center"><img src="assets/css/loading.gif" alt="loading"/></p>';

//
function clearNavActives(){
    //console.log("clearNavActives");
    $("#navNFL").removeClass("active");
    $("#navNCAAFB").removeClass("active");
    $("#navNBA").removeClass("active");
    $("#navNCAAMBB").removeClass("active");
};

// Method for setting focus to a tool (fixed position)
function focusTool(tool_name){
    var displayTop = $("#" + tool_name).position().top - 100;
    $("html, body").animate({scrollTop:displayTop}, 'fast');
};

// Run a function that contains the page's various states and determine if there is new information.
function manualRefresh(){
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

function  getLines(sport){
    console.log("sport");
//    var linesUrl =  "/lines";
//    $.ajax({ url: linesUrl,
//        data: {},
//        type: 'get',
//        success: function(res) {
//            console.log("res ");
//            console.log(res);
//            //var feedDiv = document.getElementById('feed');
//            //feedDiv.innerHTML = res;
//        },
//        error: function(err){
//            console.log("error " + err);
//            //var feedDiv = document.getElementById('feed');
//            //feedDiv.innerHTML = "ERROR LOADING DATA";
//        }
//    });

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

function processLine(l){
    var defaultField = "n/a";
    var eventName = defaultField
    var gameNumber = defaultField;
    var dateTime = defaultField;
    var sportType = defaultField;
    var league = defaultField;
    var live = defaultField;
    var awayLine = defaultField;
    var homeLine = defaultField;
    var awaySpread = defaultField;
    var homeSpread = defaultField;
    var overUnder = defaultField;
    if (typeof(l) !== "undefined"){
        if (l.hasOwnProperty("participants")) {
            var participants = l.participants.participant;
            if (participants[0].hasOwnProperty("participant_name") && participants[0].hasOwnProperty("participant_name")){
                eventName = participants[0].participant_name + " vs. " + participants[1].participant_name;
            }
        }
        if (l.hasOwnProperty("gamenumber")) {
            gameNumber = l.gamenumber;
        }
        if (l.hasOwnProperty("event_datetimeGMT")) {
            dateTime = l.event_datetimeGMT;
        }
        if (l.hasOwnProperty("sporttype")) {
            sportType = l.sporttype;
        }
        if (l.hasOwnProperty("league")) {
            league = l.league;
        }
        if (l.hasOwnProperty("IsLive")) {
            live = l.IsLive;
        }
        if (l.hasOwnProperty("periods")) {
            var periods = l.periods.period;
            if (typeof (periods) != "undefined"){
                //console.log(typeof (periods))
                //console.log(periods.length);
                if( Object.prototype.toString.call( periods ) === '[object Array]' ) {
                //if (typeof (periods) != "object"){
                    periods = periods[0];
                    //console.log("has many periods")
                }
                if (periods.hasOwnProperty("moneyline")) {
                    var moneyLine = periods.moneyline;
                    if (moneyLine.hasOwnProperty("moneyline_visiting")){
                        awayLine = moneyLine.moneyline_visiting;
                    }
                    if (moneyLine.hasOwnProperty("moneyline_home")){
                        homeLine = moneyLine.moneyline_home;
                    }
                }
                if (periods.hasOwnProperty("spread")) {
                    var spread = periods.spread;
                    if (spread.hasOwnProperty("spread_visiting")){
                        awaySpread = spread.spread_visiting;
                    }
                    if (spread.hasOwnProperty("spread_home")){
                        homeSpread = spread.spread_home;
                    }
                }
                if (periods.hasOwnProperty("total")) {
                    var total = periods.total;
                    if (total.hasOwnProperty("total_points")){
                        overUnder = total.total_points;
                    }
//                var total = periods.total;
//
//                total: Object
//                over_adjust: "-105"
//                total_points: "196"
//                under_adjust: "-105"
//
//                if (total.hasOwnProperty("over_adjust")){
//                    over = total.spread_visiting;
//                }
//                if (spread.hasOwnProperty("under_adjust")){
//                    homeSpread = spread.spread_home;
//                }
                }
            }
        }
    }
    //todo - check how many 'n/a' fields there are | determine gap in data
    //return [gameNumber, eventName, dateTime, sportType, league, live, awayLine, homeLine, awaySpread, homeSpread, over, under];
    return [eventName, dateTime, sportType, league, live, awayLine, homeLine, awaySpread, homeSpread, overUnder];;
};

//
function loadData(start_date, end_date){
    try{
        console.log("loadDate(start)");
        $("#lines_content_div").html(loadingGif);
        //var apiUri  = api + '/ec?end=' + date;
        var apiUri = "/lines";
        var apiMsg = "";
        //console.log(apiUri);
        console.log("getting lines data");
//        $.ajax(
//            {url: apiUri,
//            data: {},
//            type: 'get',
//            success: function(apiData) {
        $.getJSON( apiUri, function(apiData) {
                console.log("gettting here");
                var count = 0;
                //console.log(apiData);
                //var linesData = apiData["lines_data"];
                var table_data = new Array();
                //var table_data = [0, 1, 2, 3, 4, 5]
                var linesData = apiData["lines_data"];
                console.log(apiData);


                var totalFields = 0;
                var invalidFields = 0;
                var validFields = 0;
                validFields = totalFields -
                $.each(linesData, function (k, aLine) {
                    var lines_array = processLine(aLine);
                    totalFields += lines_array.length;
                    $.each(lines_array, function (k, field) {
                        if (field == "n/a"){
                            invalidFields ++;
                        }
                    });
                    table_data.push(lines_array);
                    //table_data.push(processLine(aLine));
                    //console.log(count);
                    //console.log(aLine);
                });
                console.log("stats")
                validFields = (totalFields - invalidFields);
                var hitPert = ((validFields / totalFields).toFixed(3) * 100) + "%";
                console.log(invalidFields);
                console.log(validFields);
                console.log(totalFields);
                console.log(hitPert);

                //console.log((Math.round(validFields / totalFields).toFixed(2) * 100));
                //console.log(validFields / totalFields);

                // Final Data Scrubbing  && Display
                var tableId = "lines_data_table";
                var tableContext='<table cellpadding="0" cellspacing="0" border="0" class="display" id="' + tableId +  '"></table>';
                $("#lines_content_div").html(tableContext);
                $("#" + tableId).dataTable( {
                    "aaData": table_data,
                    "aaSorting": [ [1,'asc'] ],
                    "bPaginate": false,
                    "bLengthChange": false,
                    "bFilter": true,
                    "bJQueryUI": true,
                    "sDom": 'T<"clear">lfrtip',
                    "oTableTools": {
                        "aButtons": [ "copy", "csv", "xls", "pdf",  "print" ],
                        "sSwfPath": "media/swf/copy_csv_xls_pdf.swf"
                    },
                    "aoColumns": [
                        //{ 'sTitle' : 'ID', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'Event', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'Date', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'Type', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'League', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'IsLive', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'AwayLine', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'HomeLine', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'AwaySpread', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'HomeSpread', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' },
                        { 'sTitle' : 'O/U', 'bSortable': true, 'aTargets': [ 1 ], 'sClass': 'center' }
                    ]
                }); //.makeEditable();
        });

//                    loadSearchTableData(dtEventData , dtTblId, event_viewer_header);
//                    if (count >= events.length){
//                        msg = "Data found for '" + date + "' => " + events.length + " events.";
//                        displayMessage("search", msg, "success");
//                        // Full Date Search
//                        // loadFullSearchTableData(fullEventsTable);
//                        // generate button handlers
//                        generateHandlers(events);
//                        $("#divSearchLoading").hide()
//                    }]
            //},
            //error: function(err){
                msg = '<b>Error </b> Bad Request - Invalid Timestamp <br/>';
                //msg = 'Data found for "' + searchDate + '" => "' + publishers.length + '" operators.<br/>';
//                displayMessage("search", msg, "error");
//                $("#divSearchLoading").hide();

            //    $("#lines_content_div").html(msg);
          //  }
        //});
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

    var start = new Date().getTime();
    var one_week_ms = 604800000;
    var end = new Date().getTime() + one_week_ms;

    loadData(start, end);

    // Every X Seconds Refresh the Page ~Manually~
//    setInterval(function(){
//        manualRefresh();
//    }, defaultInterval);

    console.log("Initialize Page End");
};

$(document).ready(function (e) {
    // Load UI(s)/Data
    initPage();

    // Key to Table Datas
    $('#btnSearchKey').click(function () {
        var keyInfo = '<h3>Search Key</h3><table class="table table-bordered table-condensed table-hover" style="width: auto;" ><thead><th>Field</th><th>Description</th></thead><tbody>';
        keyInfo += '<tr><td>Provider </td><td>The video content provider name.</td></tr>';
        keyInfo += '<tr><td>Avg. Duration </td><td>The average clip duration.</td></tr></tbody></table>';
        bootbox.alert(keyInfo, function() {});
    });

    $('#navNFL').click(function () {
        console.log("navNFL");
        clearNavActives();
        $("#navNFL").addClass("active");
        getLines("nfl");
    });

    $('#navNCAAFB').click(function () {
        console.log("navNCAAFB");
        clearNavActives();
        $("#navNCAAFB").addClass("active");
        getLines("cfb");
    });

    $('#navNBA').click(function () {
        console.log("navNBA");
        clearNavActives();
        $("#navNBA").addClass("active");
        getLines("nba");
    });

    $('#navNCAAMBB').click(function () {
        console.log("navNCAAMBB");
        clearNavActives();
        $("#navNCAAMBB").addClass("active");
        getLines("mbb");
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
