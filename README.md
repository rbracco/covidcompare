# Covid19 Comparison - View at <a href="https://covidcompare.com" target="_blank">CovidCompare.com</a>

Visualizing the spread and relative risk of Covid19 at the local level. Almost all the Covid19 maps I've seen show just the *absolute* number of cases in a location, but that's not the most important metric. 50 cases in Kentucky isn't the same as 50 cases in NYC. 

We pull in data on population/age/sex, # of hospital/ICU beds, comorbidity prevalence, and neighboring counties/states to show the *relative* risk level so that people can better understand what their community is up against and plan accordingly. 

## Examples:

### Viewing state level Covid19 statistics:

[<img src="images/basicStates.gif" alt="Comparison of US States" width=450/>](images/basicStates.gif)

### Viewing county level Covid19 statistics:

[<img src="images/basicCounties.gif" alt="Comparison of US States" width=450/>](images/basicCounties.gif)

### Visualizing trends

[<img src="images/visualizations.gif" alt="Comparison of US States" width=450/>](images/visualizations.gif)

## How to Run This Project
- This project depends on an api key from Mapbox. [Generate one here.](https://docs.mapbox.com/help/how-mapbox-works/access-tokens/)
- Add a config.js file to the root of the project directory and add the following:

```
let API_KEY_MAPBOX = '<yourMapboxApiKey>'
```
- Open index.html in the browser of your choice to begin comparing Covid19 at the state and county level.

### Pull the latest data

All the code for pulling the latest Covid19 data is stored in the `build` folder. You can update the data by manually running the Jupyter Notebook 00_add_dynamic_data.ipynb, or by converting it to a python script with `jupyter nbconvert --to script 00_add_dynamic_data.ipynb` which will create a python 
script that can be run by calling `python 00_add_dynamic_data.py` (Python 3 only). This will grab the latest data and output it to `data/states.json` and `data/counties.json` where it can be read/used.

Running the script will both display information about the data being pulled/processed, and store it to `build/logs`. The output messages are sent to `build/logs/message_logs` to be used for debugging later. A copy of the geoJSON/covid data, with timestamp, is output to `build/logs/data_logs`. 

### About the data format

`counties.json` and `states.json` are geoJSON files that include both the geometries of state/county boundaries, and statistics such as covid19 cases, population, and time_series data. The format can be a bit confusing and we will probably separate them out in a future version. For now, assuming you read `counties.json` into a variable `countyData` and read `states.json` into `statesData`, it will be structured as follows. 

- `countyData["features"]` is an array of all "features" in this case counties. Each feature has an attribute `properties` where the data is contained and `geometry` where the boundaries are contained.   
- `countyData["features"][0]["properties"]` will be the properties of the 1st county and include keys like `cases`, `deaths`, `population`, `risk_local`, `risk_total`...etc  
- Counties are uniquely identified by their geo_id, also sometimes called a FIPS. geo_ids tend to look like this `0500000US36081` but the relevant portion is the last 5 digits (commonly called the FIPS), in this example `36081`, 36 represents the state "New York" and 081 the county "Queens". Since counties in different states can have the same name, it is important to use geo_id or fips. [Here is a list of FIPS codes for the US](https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/home/?cid=nrcs143_013697) although you shouldn't need to use it as county and state names are included in the `properties`
 
### About total risk, local risk, and nearby risk
The risk calculation algorithm is currently quite simple. We plan to add to it while still keeping it fully explainable. Currently...
-Local Risk is just cases per capita for the given region
-Nearby Risk is a factor of the number of cases and population of nearby counties, exponentially decayed as a factor of distance. Every 50km further away a county is, it's risk is halved, up to a max of 100km. We would like to expand this to use transportation flows instead of distance, but as they are changing rapidly due to lockdowns and social distancing, we have not yet found a way to do this so we choose to use distance as a simple proxy.

## Contributing

We are looking for contributors of all skill levels. CovidCompare is built with leaflet and vanilla javascript, with a bit of data massaging using Python. 

We are in need of 
- Data scientists who can help us improve our risk scoring algorithm and integrate new factors like health data. We are also interested in more advanced modeling including projection. 
- Javascript programmers who can help improve the codebase and add useful features.
- [Leaflet.js](https://leafletjs.com/) and arcgis/qgis rockstars who can help make our display more useful
- People to fork this project and adapt it for other countries. Unfortunately our choice to provide data at a very local level means our project does not scale globally, but if you want to start this project for Slovakia, Mexico, Indonesia, France...etc we will support you, both with the code and on social media, and help you get going.

The best way to get started is either to open an issue about something you would like to work on, commenting on an existing issue, or by emailing me following the link in the bottom left hand page of the CovidCompare website if you want to help but aren't sure exactly where to get started. 

#### Current Contributors
- [David Zemel](https://www.github.com/dzemel)
- [Kate Eldridge](https://www.github.com/keldri)
- [Robert Bracco](https://www.github.com/rbracco)
- [Sam King](https://www.github.com/SamSamDataMan)
- [Adam Siemer](https://github.com/abcmer)

## Data

All of our data is, and will remain, open-source and free to use. Here are the sources we use:

#### Covid19 Data
- [County and State Covid19 Case and Mortality Data (Website, API)](https://covid19.mathdro.id/api) - Johns Hopkins data by way of an excellent API from [Muhammed Mustadi](https://github.com/mathdroid)
- [State Testing Data (Website, API)](https://covidtracking.com/api) and their [Crowdsourced Spreadsheet](https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vRwAqp96T9sYYq2-i7Tj0pvTf6XVHjDSMIKBdZHXiCGGdNC0ypEU9NbngS8mxea55JuCFuua1MUeOj5/pubhtml)

##### Good sources but that we don't currently use:
- [NYTimes County level data (Website, CSV)](https://github.com/nytimes/covid-19-data)
- [Corona Data Scraper (Website, API)](https://coronadatascraper.com/#home)

#### Map Data 
- [GeoJSON, SHP, and KML files for US States and Counties (Website)](https://eric.clst.org/tech/usgeojson/)
  - Credit to Eric Celeste for creating this page

#### Population Data
- County Level - [Census estimated population for 2018 (Direct Download)](https://www2.census.gov/programs-surveys/popest/datasets/2010-2018/counties/totals/co-est2018-alldata.csv)
- County Level - [Census estimated population for 2018 (Website)](https://www.census.gov/data/datasets/time-series/demo/popest/2010s-counties-total.html#par_textimage_70769902)
- State Level - [wikipdeia Census Population estimates (Website)](https://en.wikipedia.org/wiki/List_of_states_and_territories_of_the_United_States_by_population)

#### Health Data
- [HIFLD Hospital Dataset](https://hifld-geoplatform.opendata.arcgis.com/datasets/hospitals) - Taken and cleaned as they use "-999" beds to represent NaN. 
