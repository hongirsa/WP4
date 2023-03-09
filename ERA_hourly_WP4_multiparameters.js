var aoi = ee.Geometry.Point([-62.7962, 58.45]);
var start='2020-07-01'
var end='2022-08-02'
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
        .max()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('temperature_2m_daily_max');
    })
);

var daily_temperature_2m_min = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('temperature_2m')
       .filterBounds(aoi)
        .filterDate(start, end)  
        .min()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('temperature_2m_daily_min');
    })
);


var dewpoint_temperature_2m_mean = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('dewpoint_temperature_2m')
        .filterBounds(aoi)
        .filterDate(start, end)  
        .mean()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('dewpoint_temperature_2m_daily_mean');
    })
);


var total_precipitation_hourly_sum = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('total_precipitation_hourly')
       .filterBounds(aoi)
        .filterDate(start, end)  
        .sum()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('total_precipitation_daily_sum');
    })
);


var surface_solar_radiation_downwards_sum = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('surface_solar_radiation_downwards')
        .filterBounds(aoi)
        .filterDate(start, end)  
        .sum()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('surface_solar_radiation_downwards_daily_sum');
    })
);


var surface_thermal_radiation_downwards_sum = ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('surface_thermal_radiation_downwards')
        .filterBounds(aoi)
        .filterDate(start, end)  
        .sum()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('surface_thermal_radiation_downwards_daily_sum');
    })
);

// generate hourly a new wind parameter
var wind_dataset = ee.ImageCollection("ECMWF/ERA5_LAND/HOURLY").select('u_component_of_wind_10m','v_component_of_wind_10m')
            .filter(ee.Filter.date(startDate, endDate))
            .filterBounds(aoi)
            .map(function (img) {
              var  wind = img.expression({
                          expression: '(u**2+v**2)**0.5',
                          map: {
                                u: img.select('u_component_of_wind_10m'),
                                v: img.select('v_component_of_wind_10m'),
                                 }
                        }).rename('wind');
  
              var time = img.get('system:time_start');
              return wind.set('date', ee.Date(time).format('YYYY-MM-dd')).set('system:time_start',time);})
              
// get the daily sum of the new wind parameter
var daily_wind_sum= ee.ImageCollection(
  ee.List.sequence(0, numberOfDays.subtract(1))
    .map(function (dayOffset) {
      var start = startDate.advance(dayOffset, 'days');
      var end = start.advance(1, 'days');
      return wind_dataset.select('wind')
       .filterBounds(aoi)
        .filterDate(start, end)  
        .sum()
        .set('system:time_start', start.millis())
        .set('date', ee.Date(start).format('YYYY-MMM-dd')).rename('wind_daily_sum');
    })
);

var scale=daily_temperature_2m_max.first().projection().nominalScale()
//convert the parameters to a list
var ls1= daily_temperature_2m_max.toList(daily_temperature_2m_max.size())
var ls2=daily_temperature_2m_min.toList(daily_temperature_2m_min.size())
var ls3=dewpoint_temperature_2m_mean.toList(dewpoint_temperature_2m_mean.size())
var ls4=total_precipitation_hourly_sum.toList(total_precipitation_hourly_sum.size())
var ls5=surface_solar_radiation_downwards_sum.toList(surface_solar_radiation_downwards_sum.size())
var ls6=surface_thermal_radiation_downwards_sum.toList(surface_thermal_radiation_downwards_sum.size()) 
var ls7=daily_wind_sum.toList(daily_wind_sum.size()) 

//combine parameters to a list 
var daily = ee.List.sequence(0,ls1.length().subtract(1),1).map(function(i){
  return [ee.Image(ls1.get(i)).addBands(ls2.get(i)).addBands(ls3.get(i)).addBands(ls4.get(i)).addBands(ls5.get(i)).addBands(ls6.get(i)).addBands(ls7.get(i))]
})

var ft = ee.FeatureCollection(ee.List([]));
//Function to extract values from image collection based on point file and export as a table 
var fill = function(img0, ini) {
  var inift = ee.FeatureCollection(ini)
  var img=ee.Image(ee.List(img0).get(0))
  var ft2 = img.select('temperature_2m_daily_max', 'temperature_2m_daily_min', 'dewpoint_temperature_2m_daily_mean', 'total_precipitation_daily_sum', 'surface_solar_radiation_downwards_daily_sum', 'surface_thermal_radiation_downwards_daily_sum','wind_daily_sum').reduceRegions(aoi,ee.Reducer.first(), scale)

  var date = img.date().format("YYYYMMdd")
  var ft3 = ft2.map(function(f){return f.set("date", date)})
return inift.merge(ft3);
};

var profile = ee.FeatureCollection(daily.iterate(fill, ft));
// Export
Export.table.toDrive({
  collection : profile,
  description : "ERA5-"+start+"-"+end,
  fileNamePrefix : "ERA5-"+start+"-"+end,
  fileFormat : 'CSV',
  folder: 'ERA5 - Basecamp',
  selectors: ["date",'temperature_2m_daily_max','temperature_2m_daily_min','dewpoint_temperature_2m_daily_mean','total_precipitation_daily_sum','surface_solar_radiation_downwards_daily_sum','surface_thermal_radiation_downwards_daily_sum','wind_daily_sum']  /// need change here if add more parameter
});

