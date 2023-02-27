var aoi = ee.Geometry.Point([-62.7962, 58.45]);
print(aoi);
Map.addLayer(aoi);

var early = ('1979');
var late =  ('1980');

// Load in image collection and filter by area and date
var era5_dat = ee.ImageCollection('ECMWF/ERA5/DAILY')
.filterDate(early,late) //filter years of interest 
.select('mean_2m_air_temperature', 'dewpoint_2m_temperature') //
//.map(function(image){return image.clip(aoi)}); //Clips data based on 'aoi'

print('collection', era5_dat);
//var scale=ee.Number(11132)   // 0.1 dgree 

var scale=era5_dat.first().projection().nominalScale()
print (scale)

//Create variables and extract data
var ft = ee.FeatureCollection(ee.List([]));
//Function to extract values from image collection based on point file and export as a table 
var fill = function(img, ini) {
  var inift = ee.FeatureCollection(ini);
  var ft2 = img.reduceRegions(aoi, ee.Reducer.first(),scale);
  var date = img.date().format("YYYYMMdd");
  var ft3 = ft2.map(function(f){return f.set("date", date)});
return inift.merge(ft3);
};

// Iterates over the ImageCollection
var profile = ee.FeatureCollection(era5_dat.iterate(fill, ft));
print(profile,'profile');

// Export
Export.table.toDrive({
  collection : profile,
  description : "ERA5-"+early+"-"+late,
  fileNamePrefix : "ERA5-"+early+"-"+late,
  fileFormat : 'CSV',
  folder: 'ERA5 - Basecamp',
  selectors: ["date","dewpoint_2m_temperature",'mean_2m_air_temperature']
});



