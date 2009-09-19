/*Copyright (c) 2009 Johan Uhle

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/* Initialize SoundManager */
soundManager.flashVersion = 9;
soundManager.useConsole = true;
soundManager.consoleOnly = true;
soundManager.debugMode = false;
soundManager.defaultOptions.multiShot = false;
soundManager.url = "/scripts/soundmanager2_flash9.swf";
// soundManager.useHighPerformance = false;


/* Initialize Google Maps */
var map; 
var icon1;
var icon2;
var icon3;
$(function() {
  if (GBrowserIsCompatible()) {
    map = new GMap2(document.getElementById("map_canvas"));
		map.addControl(new GSmallMapControl());
		map.addControl(new GMapTypeControl());
    map.setCenter(new GLatLng(46.437857, -42.011719), 3);				
	}                                          
	   
	// Different Sized Icons for the Marker. 1 is small. 3 is big
	
	var icon1 = new GIcon(G_DEFAULT_ICON);
  icon1.image = "images/sc_marker_1.png";
  icon1.iconSize = new GSize(12, 23);
  icon1.shadow = null;
  icon1.iconAnchor = new GPoint(10, 29);
  icon1.infoWindowAnchor = new GPoint(10, 14);
	markerOptions1 = { icon:icon1 };
	
	var icon2 = new GIcon(G_DEFAULT_ICON);
  icon2.image = "images/sc_marker_2.png";
  icon2.iconSize = new GSize(18, 27);
  icon2.shadow = null;
  icon2.iconAnchor = new GPoint(10, 29);
  icon2.infoWindowAnchor = new GPoint(10, 14);
	markerOptions2 = { icon:icon2 };   
	
	var icon3 = new GIcon(G_DEFAULT_ICON);
  icon3.image = "images/sc_marker_3.png";
  icon3.iconSize = new GSize(22, 31);
  icon3.shadow = null;
  icon3.iconAnchor = new GPoint(10, 29);
  icon3.infoWindowAnchor = new GPoint(10, 14);
	markerOptions3 = { icon:icon3 };        

//  var markers = new Object(); // all markers
//  var html = new Object(); // all html blobs for tracks
	var tracks; // all tracks

  var loading = $("#player .loading");
  var progress = $("#player .progress");
  var sound;

	// genre buttons
	$(".genres a").click(function(ev) {
	  removeAllMarkers();
	  if($(this).attr("data") == 'all') {
  	  loadTracks('frontend-json/');
	  } else {
	    loadTracks('frontend-json/' + $(this).attr("data"));
	  }
	  return false;
	});
	
	function loadTracks(url) {
		/*  This function takes a url to JSON data.
				It fetches the data and makes a bubble on the map for every track.
		*/
    $.getJSON(url, '', function(data) {
      tracks = data;
      if ( tracks.length < 1) return false;
      
      $.each( tracks,	function( intIndex, track ) {                     
				var option;
				if (track.tracks_in_location < 10) {
					option = markerOptions1;
				} else {
				 	if (track.tracks_in_location < 100) {
						option = markerOptions2;
					} else {
					 	option = markerOptions3;
					};  
				};
	
        track.marker = new GMarker(new GPoint(track.location_lat, track.location_lng), option);

        track.html = $('#bubble-template')
          .clone()
          .attr('id', 'bubble' + track.track_id)
          .find('.title').html(track.title).end()
          .find('.avatar').attr("src",track.avatar_url).end()
          .find('ul li span.artist').html("<a href='http://soundcloud.com/" + track.username + "'>" + track.username + "</a>").end()
          .find('ul li span.time').html(track.created_minutes_ago + " minutes ago").end()
          .find('a.play-button').bind('click',track,showPlayer).end();

        GEvent.addListener(track.marker, "click", function() {
          track.marker.openInfoWindow(track.html[0]);
        });
        map.addOverlay(track.marker);
      });
		});
	}

  // throttling function to minimize redraws caused by soundmanager
  var throttle = function(delay, fn) {
    var last = null,
        partial = fn;

    if (delay > 0) {
      partial = function() {
        var now = new Date(),
            scope = this,
            args = arguments;

        // We are the last call made, so cancel the previous last call
        clearTimeout(partial.futureTimeout);

        if (last === null || now - last > delay) { 
          fn.apply(scope, args);
          last = now;
        } else {
          // guarentee that the method will be called after the right delay
          partial.futureTimeout = setTimeout(function() { fn.apply(scope, args); }, delay);
        }
      };
    }
    return partial;
  };

  // next random track
  $('#player .next').click(function(e) {
      playRandom();
      return false;
  });

  // next random track
  $('#player .prev').click(function(e) {
      playRandom();
      return false;
  });

  var play = function() {
    if(sound) {
      sound.paused ? sound.resume() : sound.play();
    }
  };

  function showPlayer(e) {

    var track = (e.data ? e.data : e);
    
    //$("#player-container").slideDown('slow');
    if(window.soundManager.swfLoaded) {
      window.soundManager.stopAll();
    };
    
    $("#player-container .metadata").html(track.username + " - " + track.title);
    
    sound = soundManager.createSound({
      id: track.track_id,
      url: "http://media.soundcloud.com/stream/KcoNolQWb1bB",
      whileloading : throttle(200,function() {
        loading.css('width',(sound.bytesLoaded/sound.bytesTotal)*100+"%");
      }),
      whileplaying : throttle(200,function() {
        progress.css('width',(sound.position/sound.durationEstimate)*100+"%");
        // $('.position',dom).html(formatMs(sound.position));
        // $('.duration',dom).html(formatMs(sound.durationEstimate));
      })
      // onfinish : function() {
      //   dom.removeClass("playing");
      //   sound.setPosition(0);
      // },
      // onload : function () {
      //   loading.css('width',"100%");
      // }
    });

    
    play();
    

    //$('#player').html("");
    //$('<a class="soundcloud-player" href="' + track.permalink + '">Play</a>').appendTo("#player");
    //$('#player .soundcloud-player').scPlayer({width:700, collapse:false, autoplay:true});
    //$('<img class="waveform" src="' + track.waveform_url + '" />').appendTo('#player .sc-player');
    // append next button
    // $('<a class="button-next" href="#">Next</a>')
    //   .click(function(e) {
    //     playRandom();
    //     return false;
    //   })
    //   .appendTo("#player");
    return false;
  }

	function removeAllMarkers() {
    $.each(tracks, function( intIndex, track ) {
     GEvent.clearInstanceListeners(track.marker);
     map.removeOverlay(track.marker);
    });
    tracks = null;
	}

	function playRandom() {
	  var rand = Math.floor(Math.random()*50);
    tracks[rand].marker.openInfoWindow(tracks[rand].html[0]);
    showPlayer(tracks[rand]);
	}

	// start the app
  loadTracks('frontend-json/');

});
