var hasGetUserMedia = (function() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.msGetUserMedia);
})();

if (!hasGetUserMedia) {
    $('header h2').text('Synth requires WebRTC webcam support. Try it out with Google Chrome.');
    
} else {
    $('header h2').text('Click "allow" at top of screen to start video.');
}
    
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container;

var camera, scene, renderer;

var video, texture, material, mesh;

var composer;

var mouseX = 0;
var mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var videoInput = document.getElementById('video');
var canvasInput = document.getElementById('compare');


window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
//get webcam
navigator.getUserMedia({
    video: true
}, function(stream) {
    //on webcam enabled
    videoInput.src = window.URL.createObjectURL(stream);
    $('header h2').text('Drag and Drop up to 1GB of MP3 to the Playlist.');
    $('header p').delay(1000).fadeOut(2000);
}, function(error) {
    prompt.innerHTML = 'Unable to capture WebCam. Please reload the page.';
});
var gui;
//Init DAT GUI control panel
var	ruttEtraParams = {
		bass: 0.0,
		mid: 0.0,
		treble: 0.0,
		shape: null,
		dimX: 100.0,
		dimY: 100.0,
		dimZ: 100.0,
		segX: 100.0,
		segY: 100.0,
		segZ: 100.0,
		wireframe: false,
		camerax: 0.0,
		cameray: 0.0,
		cameraz: 3600.0,
		scale : 1.0,
		multiplier :  66.6,
		displace : 33.3,
		opacity : 1.0,
		originX : 0.0,
		originY: 0.0,
		originZ : -2000.0,
		dualmonitor: false
		
	}

var dancer;

var pointer = [];
pointer.push(ruttEtraParams.bass);
pointer.push(ruttEtraParams.mid);
pointer.push(ruttEtraParams.treble);
var setting = [];
setting.push('');
setting.push('');
setting.push('');
var pointerCount = 0;

container = document.createElement( 'div' );
document.body.appendChild( container );


container = document.createElement( 'div' );
document.body.appendChild( container );

scene = new THREE.Scene();

texture = new THREE.Texture( videoInput );
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.format = THREE.RGBFormat;
texture.generateMipmaps = true;


videoMaterial = new THREE.ShaderMaterial( {
    uniforms: {

        "tDiffuse": { type: "t", value: texture },
        "multiplier":  { type: "f", value: 66.6 },
    	"displace":  { type: "f", value: 33.3 },
    	"opacity":  { type: "f", value: 1.0 },
    	"originX":  { type: "f", value: 0.0 },
    	"originY":  { type: "f", value: 0.0 },
    	"originZ":  { type: "f", value: -2000.0 }
    },

    vertexShader: RuttEtraShader.vertexShader,
    fragmentShader: RuttEtraShader.fragmentShader,
    depthWrite: true,
    depthTest: true,
    wireframe: false, 
    transparent: true,
    overdraw: false
   
});
videoMaterial.renderToScreen = true;

geometry = new THREE.PlaneGeometry(720, 480, 720, 480);
geometry.overdraw = false;
geometry.dynamic = true;
geometry.verticesNeedUpdate = true;

mesh = new THREE.Mesh( geometry, videoMaterial );

mesh.position.x = 0;
mesh.position.y = 0;


mesh.visible = true;
mesh.scale.x = mesh.scale.y = 16.0;

	
gui = new dat.GUI({autoPlace: false});
var guiContainer = document.getElementById('gui_container');
guiContainer.appendChild(gui.domElement);
gui.remember(ruttEtraParams);

var f1 = gui.addFolder('Audio');

f1.add(ruttEtraParams, 'bass', 0.0,1.0).step(0.01).listen().name("Bass").onChange(audioChange);
f1.add(ruttEtraParams, 'mid', 0.0,1.0).step(0.01).listen().name("Mid").onChange(audioChange);
f1.add(ruttEtraParams, 'treble', 0.0,1.0).step(0.01).listen().name("Treble").onChange(audioChange);
f1.open();	

var f2 = gui.addFolder('Camera');

f2.add(ruttEtraParams, 'cameraz', -6000.0,6000.0).step(100.0).listen().name("Zoom").onChange(moveCamera);
f2.add(ruttEtraParams, 'camerax', -720,720.0).step(1.0).listen().name("Camera X").onChange(moveCamera);
f2.add(ruttEtraParams, 'cameray', -720,720.0).step(1.0).listen().name("Camera Y").onChange(moveCamera);
f2.open();

var f3 = gui.addFolder('Synthesizer');

f3.add(ruttEtraParams, 'displace', -100.0, 100.0).step(0.1).listen().name("Displace").onChange(onParamsChange);
f3.add(ruttEtraParams, 'multiplier', -100.0, 100.0).step(0.1).name("Amplify").listen().onChange(onParamsChange);
f3.add(ruttEtraParams, 'originX', -2000.0, 2000.0).step(100.0).listen().name("Distort X").onChange(onParamsChange);
f3.add(ruttEtraParams, 'originY', -2000.0, 2000.0).step(100.0).listen().name("Distort Y").onChange(onParamsChange);
f3.add(ruttEtraParams, 'originZ', -2000.0, 2000.0).step(100.0).listen().name("Distort Z").onChange(onParamsChange);
f3.add(ruttEtraParams, 'opacity', 0.0,1.0).step(0.01).listen().name("Opacity").onChange(onParamsChange);
f3.open();	

var f4 = gui.addFolder('Geometry');

f4.add(ruttEtraParams, 'shape', [ 'plane', 'sphere', 'cube', 'torus' ] ).listen().name("Shape").onChange(meshChange);
f4.add(ruttEtraParams, 'scale', 0.1, 10.0).step(1.0).listen().name("Scale");
f4.add(ruttEtraParams, 'dimX', 1.0,720.0).step(1.0).listen().name("X Dimension");
f4.add(ruttEtraParams, 'dimY', 1.0,720.0).step(1.0).listen().name("Y Dimension");
f4.add(ruttEtraParams, 'dimZ', 1.0,720.0).step(1.0).listen().name("Z Dimension");
f4.add(ruttEtraParams, 'segX', 1.0,720.0).step(1.0).listen().name("X Segments");
f4.add(ruttEtraParams, 'segY', 1.0,720.0).step(1.0).listen().name("Y Segments");
f4.add(ruttEtraParams, 'segZ', 1.0,720.0).step(1.0).listen().name("Z Segments");
f4.add(ruttEtraParams, 'wireframe').onChange(onToggleWireframe);
f4.open();


var f5 = gui.addFolder('Layout');
f5.add(ruttEtraParams, 'dualmonitor').onChange(onToggleDualMonitor);
f5.open();

gui.close();

onParamsChange();
	
init();
animate();

var audio = [];
audio.playlist = [];
var audioisplaying = false;

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
 

function errorHandler(err){
 var msg = 'An error occured: ';
 
  switch (err.code) { 
    case FileError.NOT_FOUND_ERR: 
      msg += 'File or directory not found'; 
      break;
 
    case FileError.NOT_READABLE_ERR: 
      msg += 'File or directory not readable'; 
      break;
 
    case FileError.PATH_EXISTS_ERR: 
      msg += 'File or directory already exists'; 
      break;
 
    case FileError.TYPE_MISMATCH_ERR: 
      msg += 'Invalid filetype'; 
      break;
 
    default:
      msg += 'Unknown Error'; 
      break;
  };
 
 console.log(msg);
};

function playAudio(playlistId){
     	
    	audioisplaying = false;
    	dancer = new Dancer();
		// Using an audio object
		audio.nowPlaying = document.getElementById('audio');
		audio.nowPlaying.src = audio.playlist[playlistId];
		
		dancer.after( 0, function() {
		// After 0s, let's get this real and map a frequency to displacement of mesh
		// Note that the instance of dancer is bound to "this"
		ruttEtraParams.bass = this.getFrequency( 140 ) * 100;
		ruttEtraParams.mid = this.getFrequency( 210 ) * 100;
		ruttEtraParams.treble = this.getFrequency( 460 ) * 100;
		
		}).load( audio.nowPlaying );
		  
		dancer.play();
		audioisplaying = true; 	
}	

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function listResults(entries) {
  // Document fragments can improve performance since they're only appended
  // to the DOM once. Only one browser reflow occurs.
  var fragment = document.createDocumentFragment();

  entries.forEach(function(entry, i) {
   						audio.playlist.push( entry.toURL() ); 
				   	  	
				   	  	var li = document.createElement('li');
				   	  	var name = unescape(entry.name);
				   	  	var correctName = name.replace('%20', ' ');
				   	  	li.innerHTML = ['<a class="track" href="#" data-href="',entry.toURL(),
				   	  	                  '" data-title="', name, '">', name, '</a>'].join('');
				   	  	document.getElementById('playlist').insertBefore(li, null);
				   	  	
				   	  	var nodeList = Array.prototype.slice.call( document.getElementById('playlist').children );
				   	  	var index = nodeList.indexOf( li );
				   	  	
				   	  	li.onclick=function(){
				   	  		playAudio(index);
				   	  		$('#close_drop').trigger('click');
				   	  	}
  });

  document.querySelector('#playlist').appendChild(fragment);
  $('#read_files').fadeOut(1000);
}

function readFileSelect(evt) {

	evt.stopPropagation();
    evt.preventDefault();
	
	window.requestFileSystem(window.TEMPORARY, 800*1024*1024, function(fs) {
	
		var dirReader = fs.root.createReader();
		var entries = [];
		
		// Call the reader.readEntries() until no more results are returned.
		var readEntries = function() {
		   dirReader.readEntries (function(results) {
		    if (!results.length) {
		      listResults(entries.sort());
		    } else {
		      entries = entries.concat(toArray(results));
		      readEntries();
		    }
		  }, errorHandler);
		};
		
		readEntries(); // Start reading dirs.



	});
  
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();
	
	var files = evt.dataTransfer.files;

	window.requestFileSystem(window.TEMPORARY, 800*1024*1024, function(fs) {
	    // Duplicate each file the user selected to the app's fs.
	    
	  //    alert("Welcome to Filesystem!"); // Just to check if everything is OK :)
	      
	      
	    for (var i = 0, file; file = files[i]; ++i) {
	
	     
	      (function(f) {
	        
	        fs.root.getFile(f.name, {create: true, exclusive: true}, function(fileEntry) {
	          	  fileEntry.createWriter(function(fileWriter) {
	          		  fileWriter.write(f); 
	          	  }, errorHandler);
	          
	              fileEntry.file(function(file) {
			   	  var reader = new FileReader();
			   	
			   	  reader.onloadend = function(e) {
				   	  
				   	  	audio.playlist.push( fileEntry.toURL() ); 
				   	  	
				   	  	var li = document.createElement('li');
				   	  	var name = unescape(fileEntry.name);
				   	  	var correctName = name.replace('%20', ' ');
				   	  	li.innerHTML = ['<a class="track" href="#" data-href="',fileEntry.toURL(),
				   	  	                  '" data-title="', name, '">', name, '</a>'].join('');
				   	  	document.getElementById('playlist').insertBefore(li, null);
				   	  	
				   	  	var nodeList = Array.prototype.slice.call( document.getElementById('playlist').children );
				   	  	var index = nodeList.indexOf( li );
				   	  	
				   	  	li.onclick=function(){
				   	  		playAudio(index);
				   	  		$('#close_drop').trigger('click');
				   	  	}
			   	  };
			   	
			   	  reader.readAsDataURL(file);
			   	}, errorHandler);

	        }, errorHandler);
			   	
	      })(file);
	     
	
	    }
		$('header h2').text('Change controls to achieve stunning new looks.');
	    $('header').delay(8000).fadeOut(2000);
	    $('#drop_zone').css('background', 'transparent');
	    $('#read_files').fadeOut(1000);
	    
	    
	});


	
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
var readFiles = document.getElementById('read_files');  
readFiles.addEventListener('mousedown', readFileSelect, false); 
  
function init() {

	camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 3600;
	

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );
	
	var directionalLightFill = new THREE.DirectionalLight(0xffffff);
	directionalLightFill.position.set(-1, 1, 2).normalize();
	scene.add(directionalLightFill);

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );


	mesh.position.z = scene.position.z;
	scene.add( mesh );

	renderer.autoClear = false;

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );

	// postprocessing

	var renderModel = new THREE.RenderPass( scene, camera );
	var effectBloom = new THREE.BloomPass( 1.4 );
    var effectCopy = new THREE.ShaderPass( THREE.CopyShader  );

	effectCopy.renderToScreen = true;
			
	composer = new THREE.EffectComposer( renderer );
	
	composer.addPass( renderModel );
	composer.addPass( effectBloom );
	composer.addPass( effectCopy );

	navigator.getUserMedia ||
      (navigator.getUserMedia = navigator.mozGetUserMedia ||
      navigator.webkitGetUserMedia || navigator.msGetUserMedia);
//	var htracker = new headtrackr.Tracker({ui : false, headPosition : false});
//	htracker.init(videoInput, canvasInput);
//	htracker.start();
	
	//add stats
//	stats = new Stats();
//	stats.domElement.style.position = 'absolute';
//	stats.domElement.style.top = '0px';
//	container.appendChild( stats.domElement );	
	window.addEventListener( 'resize', onWindowResize, false );
				
	document.addEventListener('headtrackrStatus', 
	  function (event) {
	    if (event.status == "detecting") {
	      //do something
	    }
	     if (event.status == "found") {
			 //	camera.position.x += ( event.x - camera.position.x ) * 0.1;
			 //	camera.position.y += ( - event.y - camera.position.y ) * 0.1;
			// $('header,#drop_zone').fadeOut(8000);
			 
	    }
	});
	
	var timeoutId = 0;
	
	$('.property-name').mousedown(function() {

		
	if( $(this).not('.active') ){
	    if(pointerCount>2) pointerCount = 0;
	
	    $(this).addClass('active');
		
		if($(this).text() === 'Bass') {
			pointer[pointerCount] = ruttEtraParams.bass;
			console.log(pointer[pointerCount]);
			return;
		}
		if($(this).text() === 'Mid') {
			pointer[pointerCount] = ruttEtraParams.mid;
			console.log(pointer);
			return;
		}
		if($(this).text() === 'Treble') {
			pointer[pointerCount] = ruttEtraParams.treble;
			console.log(pointer[pointerCount]);
			return;
		}
		if($(this).text() === 'Zoom') {	
			//setting[pointerCount] = 'ruttEtraParams.cameraz = camera.position.z = pointer[i] * 100';	
			//ruttEtraParams.cameraz = setting[pointerCount];
			return;
		}
		if($(this).text() === 'Camera X') {
			//setting[pointerCount] = 'ruttEtraParams.camerax = camera.position.x = pointer[i] * 100';	
			//ruttEtraParams.camerax = setting[pointerCount];
			return;
		}
		if($(this).text() === 'Camera Y') {
			//setting[pointerCount] = 'ruttEtraParams.cameray = camera.position.y = pointer[i] * 100';
			//ruttEtraParams.cameray = setting[pointerCount];
			return;
		}
		if($(this).text() === 'Displace') {
			setting[pointerCount] = 'ruttEtraParams.displace = pointer[i] * 100';
			//ruttEtraParams.displace = setting[pointerCount];
		}
		if($(this).text() === 'Amplify') {
			setting[pointerCount] = 'ruttEtraParams.multiplier = pointer[i] * 100';
			//ruttEtraParams.multiplier = setting[pointerCount];
		}
		if($(this).text() === 'Distort X') {
			setting[pointerCount] = 'ruttEtraParams.originX = pointer[i] * 100';
			//ruttEtraParams.originX = setting[pointerCount];
		}
		if($(this).text() === 'Distort Y') {
			setting[pointerCount] = 'ruttEtraParams.originY = pointer[i] * 100';
			//ruttEtraParams.originY = setting[pointerCount];
		}
		if($(this).text() === 'Distort Z') {
			setting[pointerCount] = 'ruttEtraParams.originZ = pointer[i] * 100';
			//ruttEtraParams.originZ = setting[pointerCount];	
		}
		if($(this).text() === 'Opacity') {
			setting[pointerCount] = 'ruttEtraParams.opacity = pointer[i]';
			//ruttEtraParams.opacity = setting[pointerCount];
		}
		if( $(this).text() === 'Scale' || $(this).text() === 'X Dimension' || $(this).text() === 'Y Dimension' || $(this).text() === 'Z Dimension' || $(this).text() === 'X Segments' || $(this).text() === 'Y Segments' || $(this).text() === 'Z Segments' ) {
			return;
		}
		$(this).parent('div').children('.c').children('.slider').prepend('<div class="cancel"></div>');


		$(this).parent('div').children('.c').children('.slider').children('.cancel').on('click',function(){	
		
			var command = setting[pointerCount];
			
			for (i=0;i<=3;i++){
				if(setting[i] = command){
					setting[i] = "";
				}
			}
			$(this).parent('li').children('div:first-child').children('.property-name').removeClass('active');
			$(this).remove();
	
		});
		pointerCount++;
		}
	});
	
	function resetSetting(elem,count){
		
	}

	$('<div id="close_drop"><p>Close Playlist</p></div>').insertAfter('audio');

	$('#close_drop').on('click',function(){
		$(this).toggleClass('active');
		$('header').fadeOut(8000);
		if($(this).is('.active')){
			$('#drop_zone').hide();
			$('audio').css('top','20px');
			$('audio').hide();
			$(this).css('top', '0px');
			$(this).children('p').text('Open Playlist');
		}
		else if($(this).not('.active')){
		    $('#drop_zone').show();
		    $('audio').show();
		    $('audio').css('top','298px');
			$(this).css('top', '326px');
			$(this).children('p').text('Close Playlist');
		}
	});

}

function bgColorChange(){
	
}

function moveCamera(){

	camera.position.x = ruttEtraParams.camerax;
	camera.position.y = ruttEtraParams.cameray;
	camera.position.z = ruttEtraParams.cameraz;
}

function audioChange(){
	ruttEtraParams.bass = this.getFrequency( 140 ) * 100;
    ruttEtraParams.mid = this.getFrequency( 210 ) * 100;
    ruttEtraParams.treble = this.getFrequency( 460 ) * 100;
}

function onParamsChange(){
	if( audioisplaying === true ) {
		pointer[0] = ruttEtraParams.bass;
		pointer[1] = ruttEtraParams.mid;
		pointer[2] = ruttEtraParams.treble;
		
	for(var i=0; i<=2; i++){
		
		eval(setting[i]);
		
	    }
	}
	//copy gui params into shader uniforms
	videoMaterial.uniforms[ "displace" ].value = ruttEtraParams.displace;
	videoMaterial.uniforms[ "multiplier" ].value = ruttEtraParams.multiplier;
	videoMaterial.uniforms[ "opacity" ].value = ruttEtraParams.opacity;
	videoMaterial.uniforms[ "originX" ].value = ruttEtraParams.originX;
	videoMaterial.uniforms[ "originY" ].value = ruttEtraParams.originY;
	videoMaterial.uniforms[ "originZ" ].value = ruttEtraParams.originZ;

}

function meshChange(geo){

	
	newMesh(ruttEtraParams.shape, ruttEtraParams.dimX, ruttEtraParams.dimY, ruttEtraParams.dimZ, ruttEtraParams.segX, ruttEtraParams.segY, ruttEtraParams.segZ, ruttEtraParams.scale);
	
}

var count = 0;
function newMesh(geo, sizeX, sizeY, sizeZ, segX, segY, segZ, scale){


	scene.remove(mesh);
	
	if(geo === 'plane') {
		geometry = new THREE.PlaneGeometry(sizeX, sizeY, segX, segY);

	}
	
	else if (geo === 'sphere') {
	
		geometry = new THREE.SphereGeometry(sizeX, segX, segY);

	}
	
	else if (geo === 'cube') {
		geometry = new THREE.CubeGeometry(sizeX, sizeY, sizeZ, segX, segY, segZ);

	}
	
	else if (geo === 'torus') {
		geometry = new THREE.TorusKnotGeometry(sizeX, sizeY, segX, segY, sizeZ, segZ, scale);
	}
	drawNewMesh(geometry);
	
	
}

function drawNewMesh(geometry){
	geometry.overdraw = false;
	geometry.dynamic = true;
	geometry.verticesNeedUpdate = true;
	
	mesh = new THREE.Mesh( geometry, videoMaterial );

	mesh.position.x = 0;
	mesh.position.y = 0;
	mesh.position.z = scene.position.z;

	mesh.visible = true;
	//mesh.scale.x = mesh.scale.y = 16.0;
	mesh.scale.x = mesh.scale.y = ruttEtraParams.scale;
	scene.add(mesh);
}

function onToggleWireframe() {

  if( videoMaterial.wireframe === false ){
    	
    	videoMaterial.wireframe = true;
    	
    }
    else{
    
	  	videoMaterial.wireframe = false;
    	
    }
    
	
}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	composer.reset();

}


function onDocumentMouseMove(event) {

	mouseX = ( event.clientX - windowHalfX );
	mouseY = ( event.clientY - windowHalfY ) * 0.3;

}


function animate() {


	requestAnimationFrame( animate );

	render();
	
	//stats.update();

}


function render() {


	camera.lookAt( scene.position );

	
	if ( videoInput.readyState === videoInput.HAVE_ENOUGH_DATA ) {

		if ( texture ) texture.needsUpdate = true;
		if ( videoMaterial ) videoMaterial.needsUpdate = true;
		

	}

		onParamsChange();
		
   
	
	for (var i in gui.__controllers) {
	   gui.__controllers[i].updateDisplay();
	}
	
	
	renderer.clear();
	composer.render();

}


