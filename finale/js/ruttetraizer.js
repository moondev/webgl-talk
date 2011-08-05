/**
 * RuttEtraIzer by Felix Turner
 * www.airtight.cc
 */

//VARS
var _stage,
_lineGroup,
_lineHolder,
_stats,
_camera,
_scene,
_renderer,
_mouseX = 0,
_mouseY = 0,
_material,
_gui,
_inputImage,
_stageCenterX,
_stageCenterY,
_canvas,
_context,
_imageWidth,
_imageHeight,
_stageWidth,
_stageHeight,
_enableMouseMove = false,
_skookum

//VARS ACCESSIBLE BY GUI
_guiOptions  = {
	stageSize:	 	1,
	scale:	 		3.2,
	scanStep: 		1,
	lineThickness:	.6,
	opacity: 		1.0,
	depth: 			64,
	autoRotate: 	true,
	skookum: 'mark'
};

function saveImage() {
	render();
	window.open(_renderer.domElement.toDataURL("image/png"));
}

// Init GUI
DAT.GUI.autoPlace = false;
var _gui = new DAT.GUI();
document.getElementById('controls-container').appendChild( _gui.domElement );

//_gui = new DAT.GUI();
_gui.add(_guiOptions, 'skookum').onChange(loadSample).name('Skookum').options(
"Select a Skookum",
"skookum",
"dbecher",
"snodgrass23",
"HunterLoftis",
"markrickert",
"grizgza",
"cballou",
"jameshartsell",
"bryandelaney",
"JoshOakhurst"
);

_gui.add(_guiOptions, 'stageSize',.2,1,.1).onChange(doLayout).name('Stage Size');
_gui.add(_guiOptions, 'scale', 0.1, 10,0.1).listen().name('Scale');
_gui.add(_guiOptions, 'scanStep', 1, 20,1).onChange( createLines ).name('Line Separation');
_gui.add(_guiOptions, 'lineThickness', 0.1, 10,0.1).onChange( updateMaterial ).name('Line Thickness');
_gui.add(_guiOptions, 'depth', 0, 300,1).onChange( createLines ).name('Max Line Depth');
_gui.add(_guiOptions, 'opacity', 0, 1,0.1).onChange( updateMaterial ).name('Brightness');
_gui.add(this, 'saveImage').name('Save Image');

/**
 * Init page
 */
$(document).ready( function() {

	$(window).bind('resize', doLayout);


	// stop the user getting a text cursor
	document.onselectstart = function() {
		return false;
	};
	_stage = document.getElementById("stage");

		//init mouse listeners
	$("#stage").mousemove( onMouseMove);
	$(window).mousewheel( onMouseWheel);
	$(window).keydown(onKeyDown);
	$(window).mousedown( function() {
		_enableMouseMove = true;
	});
	$(window).mouseup( function() {
		_enableMouseMove = false;
	});
	//init stats
	_stats = new Stats();
	document.getElementById("fps-container").appendChild(_stats.domElement);

	doLayout();

	if (!Detector.webgl) {
		$("#overlay").empty();
		Detector.addGetWebGLMessage({
			parent: document.getElementById("overlay")
		});

	} else {
		initWebGL();
	}

});
function initWebGL() {

	//init camera
	_camera = new THREE.Camera(75, 16/9, 1, 3000);
	_camera.position.z = -1000;
	_scene = new THREE.Scene();

	//init renderer
	_renderer = new THREE.WebGLRenderer({antialias: true,clearAlpha: 1,sortObjects: false,sortElements: false});
	
	//_renderer = new THREE.SvgRenderer({antialias: true,clearAlpha: 1,sortObjects: false,sortElements: false});
	
	//renderer = new THREE.CanvasRenderer();

	_lineHolder = new THREE.Object3D();
	_scene.addObject(_lineHolder);

	doLayout();

	animate();
}

function onImageLoaded() {

	// load image into canvas pixels
	_imageWidth = _inputImage.width;
	_imageHeight = _inputImage.height;
	_canvas	= document.createElement('canvas');
	_canvas.width = _imageWidth
	_canvas.height = _imageHeight;
	_context = _canvas.getContext('2d');
	_context.drawImage(_inputImage, 0, 0);
	_pixels	= _context.getImageData(0,0,_imageWidth,_imageHeight).data;
	_enableMouseMove = false;
	createLines();
}

/**
 * Create Lines from image
 */
function createLines() {

	$("#overlay").hide();
	_stage.appendChild(_renderer.domElement);

	var x = 0, y = 0;

	if (_lineGroup)
		_scene.removeObject(_lineGroup);

	_lineGroup = new THREE.Object3D();

	_material = new THREE.LineBasicMaterial({
		color: 0xffffff,
		opacity: _guiOptions.opacity,
		linewidth: _guiOptions.lineThickness,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		vertexColors: true
	} );

	// go through the image pixels
	for(y = 0; y < _imageHeight; y+= _guiOptions.scanStep) {
		var geometry = new THREE.Geometry();
		for(x = 0; x < _imageWidth ; x+= _guiOptions.scanStep) {
			var color = new THREE.Color(getColor(x, y));
			var brightness = getBrightness(color);
			var posn = new THREE.Vector3(x -_imageWidth/2,y - _imageHeight/2, -brightness * _guiOptions.depth + _guiOptions.depth/2);
			geometry.vertices.push(new THREE.Vertex(posn));
			geometry.colors.push(color);
		}
		//add a line
		var line = new THREE.Line(geometry, _material );
		_lineGroup.addChild(line);
	}

	_lineHolder.addChild(_lineGroup);
}

function updateMaterial() {
	if (_material) {
		_material.opacity = _guiOptions.opacity;
		_material.linewidth = _guiOptions.lineThickness;
	}
}

function onMouseMove(event) {
	if (_enableMouseMove) {
		_mouseX = event.pageX - _stageCenterX;
		_mouseY = event.pageY - _stageCenterY;
	}
}

function onMouseWheel(e,delta) {
	_guiOptions.scale += delta * 0.1;
	//limit
	_guiOptions.scale = Math.max(_guiOptions.scale, .1);
	_guiOptions.scale = Math.min(_guiOptions.scale, 10);
}

function onKeyDown(evt) {
	//save on 'S' key
	if (event.keyCode == '83') {
		saveImage();
	}
}

function animate() {
	requestAnimationFrame(animate);
	render();
	_stats.update();
}

function render() {

	_lineHolder.scale = new THREE.Vector3(_guiOptions.scale,_guiOptions.scale, _guiOptions.scale);

	var xrot = _mouseX/_stageWidth * Math.PI*2 + Math.PI;
	var yrot = _mouseY/_stageHeight* Math.PI*2 + Math.PI;
	
	
	_lineHolder.rotation.x += (-yrot - _lineHolder.rotation.x) * 0.3;
	_lineHolder.rotation.y += (xrot - _lineHolder.rotation.y) * 0.3;
	

	_renderer.render(_scene, _camera);
	
}

function doLayout() {

	var winHeight, winWidth, controlsWidth, containerWidth;

	//get dims
	winHeight = window.innerHeight ? window.innerHeight : $(window).height();
	winWidth = window.innerWidth ? window.innerWidth : $(window).width();
	controlsWidth = $('#controls').outerWidth();

	//set container size
	$('#container').height(parseInt(winHeight));
	$('#container').width(parseInt(winWidth) - parseInt(controlsWidth));
	containerWidth = $('#container').outerWidth();

	//set stage size as fraction of window size
	//use letterbox dimensions unless 100%
	_stageWidth = containerWidth * _guiOptions.stageSize;
	_stageHeight = containerWidth * _guiOptions.stageSize * 9 / 16;

	if (_guiOptions.stageSize === 1) {
		_stageHeight = $('#container').outerHeight();
	}
	$('#stage').width(_stageWidth);
	$('#stage').height(_stageHeight);

	//Center stage div inside window
	$('#stage').css({
		left: Math.max((containerWidth - _stageWidth)/2 + controlsWidth,controlsWidth),
		top: (winHeight -_stageHeight)/2,
		visibility:"visible"
	});

	//set webgl size
	if (_renderer) {
		_renderer.setSize(_stageWidth, _stageHeight);
		_camera.aspect = _stageWidth / _stageHeight;
		_camera.updateProjectionMatrix();
	}

	_stageCenterX = $('#stage').offset().left +_stageWidth / 2;
	_stageCenterY = window.innerHeight / 2
}

// Returns a hexidecimal color for a given pixel in the pixel array.
function getColor(x, y) {
	var base = (Math.floor(y) * _imageWidth + Math.floor(x)) * 4;
	var c = {
		r: _pixels[base + 0],
		g: _pixels[base + 1],
		b: _pixels[base + 2],
		a: _pixels[base + 3]
	};
	return (c.r << 16) + (c.g << 8) + c.b;
};

//return pixel brightness between 0 and 1 based on human perceptual bias
function getBrightness(c) {
	return ( 0.34 * c.r + 0.5 * c.g + 0.16 * c.b );
};

function loadSample() {
	_enableMouseMove = false;
	_inputImage = new Image();
	timg = "img/img.php?t=" + _guiOptions.skookum;
	
	if(_guiOptions.skookum == 'bryandelaney'){
	timg = "img/weather.png";
	}
	
	_inputImage.src = (timg);
	
	$('#orig').attr("href",timg);
	
	//$(".guidat-controller option").html('skookum');

	_inputImage.onload = function() {
		onImageLoaded();
		//_enableMouseMove = false;
	};
}

$(window).load(function(){
//$(".guidat-controller option").html('skookum');
$('#fps-container').html('<a id="orig" href="">original image</a>');

});