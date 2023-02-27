
var aoi = ee.Geometry.Point([-62.7962, 58.45]);

var start='2020-07-01'
var end='2021-07-01'
var startDate=ee.Date(start)
var endDate=ee.Date(end)
                 
var numberOfDays = endDate.difference(startDate, 'days');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////// to generate daily product based on hourly product, choose two products as an example/////////////////////////////////
var daily_temperature_2m_max = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('temperature_2m')
        .filterBounds(aoi)
        .filterDate(start, end)  
        .mean()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd'));
    })
);

print (daily_temperature_2m_max,'daily_temperature_2m_max')

var scale=daily_temperature_2m_max.first().projection().nominalScale()
print (scale)

var daily_dewpoint_temperature_2m_min = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('dewpoint_temperature_2m')
        .filterBounds(aoi)
        .filterDate(start, end)  
        .mean()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd'));
    })
);

print (daily_dewpoint_temperature_2m_min, 'daily_dewpoint_temperature_2m_min')

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////comeine daily product of different parameters into one list ////////////////////////////////////
var daily= daily_temperature_2m_max.toList(1000000).zip(daily_dewpoint_temperature_2m_min.toList(1000000)) /// need change here if add more parameter
    .map(function(row) {
        return ee.Image(ee.List(row).get(0))
              .addBands(ee.List(row).get(1)) /// need change here if add more parameter, like .addBands(ee.List(row).get(2)), etc.
})

print (daily, 'daily')

var ft = ee.FeatureCollection(ee.List([]));
//Function to extract values from image collection based on point file and export as a table 
var fill = function(img0, ini) {
  var inift = ee.FeatureCollection(ini)
  var img=ee.Image(img0)
 
  var ft2 = img.select('temperature_2m','dewpoint_temperature_2m').reduceRegions(aoi,ee.Reducer.first(), scale)
  var date = img.date().format("YYYYMMdd")
  var ft3 = ft2.map(function(f){return f.set("date", date)})
return inift.merge(ft3);
};

// Iterates over the list
var profile = ee.FeatureCollection(daily.iterate(fill, ft));
print(profile,'profile');

// Export
Export.table.toDrive({
  collection : profile,
  description : "ERA5-"+start+"-"+end,
  fileNamePrefix : "ERA5-"+start+"-"+end,
  fileFormat : 'CSV',
  folder: 'ERA5 - Basecamp',
  selectors: ["date",'dewpoint_temperature_2m','temperature_2m']  /// need change here if add more parameter
});
