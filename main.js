import 'ol/ol.css';
import Map from 'ol/Map';
import Tile from 'ol/layer/Tile';
import View from 'ol/View';
import {bbox} from 'ol/loadingstrategy';
//import { Style, Stroke } from 'ol/style';
import OSM from 'ol/source/OSM';
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from 'ol/format/GeoJSON';

import {Circle as CircleStyle, Fill, Style, Stroke} from 'ol/style';
import {Draw, Modify, Snap} from 'ol/interaction';
//import {OSM, Vector as VectorSource} from 'ol/source';
//import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Feature from 'ol/Feature';
import axios from "axios";


//--------------

var source = new VectorSource();
var vectorDrawingLayer = new VectorLayer({
  source: source,
  style: new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
      color: '#ff00ff',
      lineDash: [10, 10],
      width: 3,
    }),
    image: new CircleStyle({
      radius: 15,
      fill: new Fill({
        color: '#ffcc33',
      }),
    }),
  }),
});


//--------------

var vectorSource = new VectorSource({
  format: new GeoJSON(),
  loader: function(extent, resolution, projection) {
    var url = 'https://ahocevar.com/geoserver/wfs?service=WFS&' +
    'version=1.1.0&request=GetFeature&typename=osm:water_areas&' +
    'maxFeatures=500&outputFormat=application/json&srsname=EPSG:3857&' +
    'bbox=' + extent.join(',') + ',EPSG:3857';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    var removeExtent = function() {
      vectorSource.removeLoadedExtent(extent);
    }
    xhr.onerror = removeExtent;
    xhr.onload = function() {
      if (xhr.status == 200) {
        vector.getSource().clear();
        vectorSource.addFeatures(
          vectorSource.getFormat().readFeatures(xhr.responseText));
      }
      removeExtent();
    }
    xhr.send();
  },
  strategy: bbox
});

var vector = new VectorLayer({
  source: vectorSource,
  style: new Style({
    stroke: new Stroke({
      color: 'rgba(0, 0, 255, 1.0)',
      width: 2
    })
  })
});

var raster = new Tile({
  source: new OSM({
  })
});

var map = new Map({
  layers: [raster, vectorDrawingLayer],
  target: document.getElementById('map'),
  view: new View({
    center: [-8908887.277395891, 5381918.072437216],
    maxZoom: 19,
    zoom: 6
  })
});





//--------------

var modify = new Modify({source: source});
map.addInteraction(modify);

var draw, snap; // global so we can remove them later
var typeSelect = document.getElementById('type');

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  map.addInteraction(draw);
  snap = new Snap({source: source});
  map.addInteraction(snap);
}

/**
 * Handle change event.
 */
typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  addInteractions();
};

addInteractions();


var button= document.getElementById("listButton");
button.onclick = function() { 
	console.log("List features: ")
  	console.log(source.getFeatures().length);
  // source.getFeatures().forEach((f)=>{
  //   GeoJSON.writeFeature(f.getGeometry());
  //   //console.log(GeoJSON.writeFeature(f.getGeometry()));
  //   console.log(f.getGeometry());
  // });

 	var geom = [];
 	var writer = new GeoJSON();
 	let count=0;
 	source.forEachFeature( function(feature) { 
 		count++;
  		let f = new Feature(feature.getGeometry().clone().transform('EPSG:3857', 'EPSG:4326'));
   		
   
   		let geoJsonFeature = writer.writeFeatureObject(f);
   		console.log(geoJsonFeature);
   		console.log(writer.writeGeometry(f.getGeometry()));
   		if (geoJsonFeature["geometry"] != undefined) {
   			if (geoJsonFeature["geometry"]["type"] === "Point") {
       			//geoJsonFeature["geometry"]["coordinates"] = [geoJsonFeature["geometry"]["coordinates"]];
       			f.setProperties({"sigwx": "tropopause", "level" : "high"}, true);
   			} else if (geoJsonFeature["geometry"]["type"] === "Polygon") {
       			//geoJsonFeature["geometry"]["coordinates"] = geoJsonFeature["geometry"]["coordinates"][0];
       			f.setProperties({"sigwx": "cloud", "level" : "high"}, true);
   			} else {
   				f.setProperties({"sigwx": "jetstream", "level" : "high"}, true);
   			}
   		}
   		f.setId(count);

   		let geoJsonStringFeature = writer.writeFeature(f);
   		console.log(geoJsonStringFeature);


   		geom.push(f); 
		let axiosConfig = {
  			headers: {
      				'Content-Type': 'application/json;charset=UTF-8',
  					}
		};


  //  axios.post('http://localhost:8081/register/feature', geoJsonFeature, /*axiosConfig*/)
  //       .then((res) => {
  //           console.log(res);
  //       }).catch(function (error) {
  //           console.log(error);
  //       }).finally(function () {
  //           console.log("finish axios");
  //       });

  	});
 
// var geoJsonStr = writer.writeFeatures(geom);
// console.log(geoJsonStr)
var geoJsonFeaturesObject = writer.writeFeaturesObject(geom);
console.log(geoJsonFeaturesObject); // logging the output as GeoJSON object
console.log(writer.writeFeatures(geom))  // logging the output as string

   axios.post('http://localhost:8081/register/features', geoJsonFeaturesObject, /*axiosConfig*/)
        .then((res) => {
            console.log(res);
        }).catch(function (error) {
            console.log(error);
        }).finally(function () {
            console.log("finish axios");
        });

}; 
