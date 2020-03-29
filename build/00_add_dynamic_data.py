#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import json, requests
import math
import numpy as np
from pathlib import Path
from collections import defaultdict
import datetime
import shutil
import logging


# ## General Setup

# ### Read in static data

# In[2]:


county_data_folder = Path('static_data/county')
with open(county_data_folder/"staticCounties.json", 'r') as f:
    county_json = json.load(f)


# In[3]:


state_data_folder = Path('static_data/state')
with open(state_data_folder/"staticStates.json", 'r') as f:
    state_json = json.load(f)


# We make one request that will be parsed once for State Data and once for county

# In[4]:


def request_multiple_attempts(url):
    #print_and_log(f"Requesting data from {url}")
    num_requests = 0
    max_requests = 5
    req = requests.get(api_url)
    if(not req.status_code == 200):
        num_requests += 1 
        if(num_requests >= max_requests): req.raise_for_status()
        req = requests.get(api_url)
    #print_and_log("Data Received\n")
    return req


# ### Go through the county_json records and index by geo_id

# In[5]:


geo_id_index_dict = {}
counties = county_json["features"]
for idx, county in enumerate(counties):
    geo_id = county["properties"]["geo_id"]
    geo_id_index_dict[geo_id] = idx


# ### Setup logging

# In[6]:


now = datetime.datetime.now()
date_str = f"{now.month}-{now.day}-{now.year}-{now.hour}{now.minute}"


# In[7]:


logging.basicConfig(filename=f'logs/message_logs/{date_str}.log',level=logging.DEBUG)


# In[8]:


def print_and_log(message):
    logging.info(message)
    print(message)


# ## Add new data from APIs

# ### Add State Covid19 data from John's Hopkins

# In[9]:


#data from John Hopkins CSSE
api_url = "https://covid19.mathdro.id/api/countries/USA/confirmed"
covid_jh = request_multiple_attempts(api_url).json()


# #### Test that data appears to be valid

# In[10]:


# there should be at least 1700 counties
num_counties = len(covid_jh)
if (num_counties < 1700): raise ValueError("Only", num_counties, " counties found in Johns Hopkins data")
mandatory_keys = ['fips', 'confirmed', 'recovered', 'deaths', 'active', 'combinedKey', 'provinceState']
for key in mandatory_keys:
    if not key in covid_jh[120]: raise ValueError("John's Hopkins Record missing key: ", key)


# In[11]:


covid_jh[0].keys()


# In[12]:


#includes ms which fromtimestamp doesnt accept so we cut it off
def get_str_from_timestamp(timestamp):
    timestamp = int(str(timestamp)[:-3])
    cur = datetime.datetime.fromtimestamp(timestamp)
    return cur.strftime('%#m/%d %#I:%M%p')


# In[13]:


#initialize all state case data to 0
null_dict = {"cases":0, "deaths":0, "active":0, "recovered":0}
for state in state_json["features"]:
    state["properties"].update(null_dict)


# In[14]:


keys = ["deaths", "recovered", "active"]
def add_record_to_state(record):
    for state in state_json["features"]:
        if(record["provinceState"] == state["properties"]["statename"]):
            for key in keys:
                state["properties"][key] += int(record[key])
            state["properties"]["cases"] += int(record["confirmed"])
            state["properties"]["time_cases_update"] = get_str_from_timestamp(record["lastUpdate"])
            return
    print_and_log(f"{record} unmatched")


# In[15]:


def add_unassigned_to_state(statename, record):
    for state in state_json["features"]:
        props = state["properties"]
        if(props["statename"].lower() == statename.lower()):
            print_and_log(f'{record["confirmed"]} unassigned cases added to {statename}')
            props["unassigned_cases"] = record["confirmed"]
            props["unassigned_deaths"] = record["deaths"]


# In[16]:


skips = ["Diamond Princess, US", "Guam, US", "Grand Princess, US", "Puerto Rico, US", "Virgin Islands, US"]
for record in covid_jh:
    if(record == {}): continue
    if record["combinedKey"] in skips: continue
    county, state, _ = map(str.strip, record["combinedKey"].split(','))
    if county == "Unassigned":
        add_unassigned_to_state(state, record)
    add_record_to_state(record)


# ### Add County Covid Data19 from John's Hopkins
# 

# In[17]:


#initialize all county case data to 0
for county in counties:
    county["properties"].update(null_dict)


# In[18]:


skips = ["Diamond Princess, US", "Guam, US", "Grand Princess, US", "Puerto Rico, US", "Virgin Islands, US"]
missing_fips = {
    "Dona Ana,New Mexico,US":"35013", 
    "Kansas City,Missouri,US":"29095", 
    "Dukes and Nantucket,Massachusetts,US":"25007"
}


# In[19]:


def add_record_to_county(record):
    if("Unassigned" in record["combinedKey"]): return
    #sub in countyid for counties that have missing county id
    if(record["combinedKey"] in missing_fips): 
        record["fips"] = missing_fips[record["combinedKey"]]
    #skip anything without a countyID
    if(record['fips'] is None):
        print_and_log(f'No geo_id, skipping {record["combinedKey"]}')
        return
    #skip anything in the skip list
    if(record["combinedKey"] in skips): return
    geo_id = '0500000US' + record["fips"]
    
    county = counties[geo_id_index_dict[geo_id]]
    #Add the contents of record to the county
    for key in keys:
        county["properties"][key] += int(record[key])
    county["properties"]["cases"] += int(record["confirmed"])
    county["properties"]["time_cases_update"] = get_str_from_timestamp(record["lastUpdate"])


# In[20]:


for record in covid_jh:
    add_record_to_county(record)


# #### Reassign NYC to the proper counties

# In[21]:


new_york_county = counties[geo_id_index_dict['0500000US36061']]
queens_county = counties[geo_id_index_dict['0500000US36081']]
ny_cases = new_york_county["properties"]["cases"]
ny_deaths = new_york_county["properties"]["deaths"]
ny_time_updated = new_york_county["properties"]["time_cases_update"]
queens_cases = queens_county["properties"]["cases"]
nyc_reassignment_needed = ny_cases > 0 and queens_cases == 0
if(ny_cases <= 0 or not isinstance(ny_cases, int)): raise ValueError("Problem with NYCases, value:", ny_cases)
print_and_log(f"{ny_cases} cases initially in New York County")
print_and_log(f"{queens_cases} in queens.")
print_and_log(f"Reassign needed: {nyc_reassignment_needed}")


# In[22]:


# This is based on an estimate on 3/21/20 in which NYC had 5687 cases broken down as follows
# this has since been updated on 3/26/20 for data from here: 
# https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary.pdf
# https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary-deaths.pdf
# # Kings - 1750, Queens - 1514, New York 1402, Bronx 736, Richmond 285
cases_proportion_dict = {
    #code:proportion of NYC cases
    #queens
    '0500000US36081':.32139,
    #kings
    '0500000US36047':.26191,
    #Bronx
    '0500000US36005':.17731,
    #Richmond (Staten Island)
    '0500000US36085':.05837,
    #New York (Manhattan)
    '0500000US36061':.18102,
}
deaths_proportion_dict = {
    #code:proportion of NYC cases
    #queens
    '0500000US36081':.33,
    #kings
    '0500000US36047':.23,
    #Bronx
    '0500000US36005':.21,
    #Richmond (Staten Island)
    '0500000US36085':.08,
    #New York (Manhattan)
    '0500000US36061':.15,
}
# #get cases that were all aggregated in NY county


# In[23]:


ny_county_names = {
    '0500000US36081':'Queens County',
    '0500000US36047':'Kings County',
    '0500000US36005':'Bronx County',
    '0500000US36085':'Richmond County',
    '0500000US36061':'Manhattan',
}


# In[24]:


print_and_log(f"\nTotal Cases listed for New York County {ny_cases}")
if(nyc_reassignment_needed):
    print_and_log("Reassigning NYC with proportional estimates")
    for county in counties:
        county_id = county["properties"]["geo_id"]
        if county_id in cases_proportion_dict.keys():
            county["properties"]["cases"] = int(ny_cases*cases_proportion_dict[county_id])
            county["properties"]["deaths"] = int(ny_deaths*deaths_proportion_dict[county_id])
            county["properties"]["time_cases_update"] = ny_time_updated
            county["properties"]["notes"] = "Data for this county is estimated"
else:
    print_and_log("\nQueens County found, not estimating NYC")


# ### Add Covid Test Data from Covid Tracking Project

# In[25]:


def format_test_time(test_time):
    d, h = test_time.split(' ')
    h, m = h.split(":")
    h = int(h)
    am_pm = "AM" if h <= 12 else "PM"
    if(am_pm) == "pm": h-=12
    return f"{d} {h}:{m}{am_pm}"


# In[26]:


#https://covidtracking.com/api/states/info <- this api has info about where the data comes from
api_url = 'https://covidtracking.com/api/states'
state_tests = request_multiple_attempts(api_url).json()


# #### Test that data appears to be valid

# In[27]:


# there should be at least 50 entries
num_states = len(state_tests)
if (num_states < 50): raise ValueError("Only", num_states, " states found in covidtracking testing data")
mandatory_keys = ['state', 'lastUpdateEt', 'positive', 'negative', 'total']
for key in mandatory_keys:
    if not key in state_tests[20]: raise ValueError("CovidTracking testing missing key: ", key)


# In[28]:


state_tests[20]


# In[29]:


for state1 in state_tests:
    if(state1 == {}): continue
    for state2 in state_json["features"]:
        if(state1["state"] == state2["properties"]["abbr"]):
            state2["properties"]["time_tests_updated"] = format_test_time(state1["lastUpdateEt"])
            state2["properties"]["test_grade"] = state1["grade"]
            testing_keys = ["test_positive", "test_negative", "test_total"]
            for key in testing_keys:
                state2["properties"][key] = state1[key.split('_')[1]]


# ## Per Capita Calculations and Data

# In[30]:


print_and_log("\nAdding per capita stats for county")
for county in counties:
    props = county["properties"]
    per_cap = props["population"]/100000
    props["pc_cases"] = props["cases"]/per_cap
    props["pc_deaths"] = props["deaths"]/per_cap


# In[31]:


print_and_log("Adding per capita stats for states")
for state in state_json["features"]:
    props = state["properties"]
    per_cap = props["population"]/100000
    props["pc_cases"] = props["cases"]/per_cap
    props["pc_active"] = props["active"]/per_cap
    props["pc_deaths"] = props["deaths"]/per_cap
    props["pc_tests"] = props["test_total"]/per_cap  


# ## Time Series Data

# ### Add County time series

# In[32]:


with open(county_data_folder/'countyTimeData.json', 'r') as f:
    county_time_data = json.load(f)


# #### Add today's data to time series

# Note we wont display this in time series until tomorrow becauseit makes it look like curve is flattening

# In[33]:


today = datetime.datetime.today()
todays_date = f"{today.month}-{today.day}-{today.year}"
print_and_log(f"Adding time series for today: {todays_date}")


# In[34]:


counties


# In[35]:


for county in counties:
    props = county["properties"]
    geo_id = props["geo_id"]
    cases = props["cases"]
    deaths = props["deaths"]
    county_time_data[geo_id][todays_date] = {"cases":cases, "deaths":deaths}


# #### Add time series to county geojson

# In[36]:


for county in counties:
    geo_id = county["properties"]["geo_id"]
    county["properties"]["time_series"] = county_time_data[geo_id]


# In[37]:


counties[0]


# #### Save latest state time series data to file

# In[38]:


with open(county_data_folder/"countyTimeData.json", 'w') as f:
    json.dump(county_time_data, f)


# ### Add State time series

# In[39]:


with open(state_data_folder/'stateTimeData.json', 'r') as f:
    state_time_data = json.load(f)


# In[40]:


state_time_data


# #### Add today's data to state time series

# This makes it look like curve is flattening, so we adding it now, but dont display it until the next day

# In[41]:


for cur_state in state_json["features"]:
    props = cur_state["properties"]
    statename = props["statename"]
    state_time_data[statename][todays_date] = {
        "cases":props["cases"], 
        "deaths":props["deaths"],
        "recovered":props["recovered"],
        "test_total":props["test_total"],
        "test_negative":props["test_negative"],
        "test_positive":props["test_positive"],
    }


# #### Add old state date to state time series

# In[42]:


for state in state_json["features"]:
    statename = state["properties"]["statename"]
    if statename in state_time_data.keys():
        state["properties"]["time_series"] = state_time_data[statename]


# #### Save latest state time series data to file

# In[43]:


state_json["features"][0]


# In[44]:


with open(county_data_folder/"stateTimeData.json", 'w') as f:
    json.dump(county_time_data, f)


# ## Calculate Risk

# ### Add in county risk

# In[45]:


#111 is to convert degrees to kilometers
def get_distance(c0, c1):
    lat_dist = abs(c0[0])-abs(c1[0])
    lng_dist = abs(c0[1])-abs(c1[1])
    distance = 111 * math.sqrt(lat_dist**2 + lng_dist**2)
    return float(distance)


# #### County Local Risk

# In[46]:


def calc_county_local_risk(props):
    cases = props["cases"]
    try:
        population = props["population"]
    except KeyError:
        print_and_log(f"{props['name']}, {props['statename']}")
        raise KeyError
    if cases == 'NaN': 
        print_and_log('NaN cases found')
        cases = 0
    return cases/(population/100000) if population != -1 else -1


# In[47]:


print_and_log("\nCalculating local county risk")
for county in counties:
    county["properties"]["risk_local"] = calc_county_local_risk(county["properties"])


# #### County Neighbor Risk

# In[48]:


def calc_county_neighbor_risk(risks):
    total_neighbor_risk = 0
    num_risks = len(risks)
    if(num_risks == 0): return 0
    total_cases = 0
    total_pop = 0
    for risk in risks.values():
        distance, neighbor_cases, neighbor_pop = risk.values()
        #total_neighbor_risk += (float(neighbor_cases)*(2**((-distance-50)/50)))
        exp = 2**((-distance-50)/50)
        total_cases += float(neighbor_cases)*(2**((-distance-50)/50))
        total_pop += (float(neighbor_pop)*(2**((-distance-50)/50)))/100000
    total_neighbor_risk = total_cases/total_pop
    return total_neighbor_risk


# In[49]:


def get_county_all_neighbor_risk(props):
    risk_details = {}
    for county in counties:
        neighbor_props = county["properties"]
        neighbor_risk = get_county_neighbor_risk(props, neighbor_props)
        if(neighbor_risk != {}): risk_details[neighbor_props["geo_id"]] = neighbor_risk
    props["risk_nearby"] = calc_county_neighbor_risk(risk_details)
    props["risk_total"] = props["risk_nearby"] + props["risk_local"]


# In[50]:


MAX_DISTANCE = 100
def get_county_neighbor_risk(props, neighbor_props):
    geoID1 = props["geo_id"]
    geoID2 = neighbor_props["geo_id"]
    centroid = [props["lat"], props["long"]]
    centroid_neighbor = [neighbor_props["lat"], neighbor_props["long"]]
    distance = get_distance(centroid, centroid_neighbor)
    neighbor_cases = neighbor_props["cases"]
    neighbor_population = neighbor_props["population"]
    if(geoID1 == geoID2 or distance > MAX_DISTANCE or neighbor_cases == "NaN"): 
        return {}
    else:
        return {"distance":distance, "cases":neighbor_cases, "pop":neighbor_population}


# In[51]:


print_and_log("\nCalculating local county risk")
for county in counties:
    get_county_all_neighbor_risk(county["properties"])


# ### Add in state risk

# ####  Local State Risk

# In[52]:


#111 is to convert degrees to kilometers
def get_distance(c0, c1):
    lat_dist = abs(c0[0])-abs(c1[0])
    lng_dist = abs(c0[1])-abs(c1[1])
    distance = 111 * math.sqrt(lat_dist**2 + lng_dist**2)
    return distance


# In[53]:


def calc_state_local_risk(props):
    #changed from props["active"] change back when possible
    cases = props["cases"]
    population = props.get("population", -1)
    if cases == 'NaN': cases = 0
    return cases/(population/100000) if population != -1 else -1


# In[54]:


print_and_log("Calculating local state risk")
for state in state_json["features"]:
    state["properties"]["risk_local"] = calc_state_local_risk(state["properties"])


# #### Neighbor State Risk

# In[55]:


def get_state_all_neighbor_risk(props):
    risk_details = {}
    for state in state_json["features"]:
        neighbor_props = state["properties"]
        neighbor_risk = get_state_neighbor_risk(props, neighbor_props)
        if(neighbor_risk != {}): 
            risk_details[neighbor_props["abbr"]] = neighbor_risk
    props["risk_nearby"] = calc_state_neighbor_risk(risk_details)
    props["risk_total"] = props["risk_nearby"] + props["risk_local"]


# In[56]:


def calc_state_neighbor_risk(risks):
    num_risks = len(risks)
    total_neighbor_risk = 0
    for risk in risks.values():
        distance, neighbor_cases, neighbor_pop = risk.values()
        total_neighbor_risk += (neighbor_cases*(2**((-distance-150)/50)))
    return total_neighbor_risk


# In[57]:


def get_state_neighbor_risk(props, neighbor_props):
    neighbor_centroid = [neighbor_props["lat"], neighbor_props["long"]]
    #changed from props["active"] change back when possible
    neighbor_cases = neighbor_props["cases"]
    neighbor_pop = neighbor_props["population"]
    centroid = [props["lat"], props["long"]]
    distance = get_distance(centroid, neighbor_centroid)
    if(props["abbr"] == neighbor_props["abbr"] or neighbor_cases == "NaN"):
        return {}
    else:
        return {"DISTANCE":distance, "CASES":neighbor_cases, "POP":neighbor_pop}


# In[58]:


print_and_log("Calculating neighbor state risk\n")
for state in state_json["features"]:
    get_state_all_neighbor_risk(state["properties"])


# ## View Output

# In[59]:


county_json["features"][408]


# In[60]:


state_json["features"][0]


# ## Export

# In[65]:


print_and_log("Exporting Files")
# this just makes sure we dont have any encoding problems, taken from stackoverflow
class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(NpEncoder, self).default(obj)

with open("states.json", 'w') as f:
    json.dump(state_json, f, cls=NpEncoder)

with open("stateData.js", 'w') as f:
    f.write("let stateData = ")
    json.dump(state_json, f, cls=NpEncoder)
    
with open("counties.json", 'w') as f:
    json.dump(county_json, f, cls=NpEncoder)

with open("countyData.js", 'w') as f:
    f.write("let countyData = ")
    json.dump(county_json, f, cls=NpEncoder)


# In[66]:


live_path = Path("/var/www/html/data")
test_path = Path("../data")
if(live_path.exists()):
    print_and_log("Copying data to the /var/www/html")
    shutil.copy("stateData.js", live_path/"stateData.js")
    shutil.copy("countyData.js", live_path/"countyData.js")
    shutil.copy("counties.json", live_path/"counties.json")
    shutil.copy("states.json", live_path/"states.json")
    print_and_log("Data successfully copied to live path")
else:
    print_and_log(f"{live_path} not found, NOT COPYING DATA")
    if(test_path.exists()):
        print_and_log("Copying data to the test path")
        shutil.copy("stateData.js", test_path/"stateData.js")
        shutil.copy("countyData.js", test_path/"countyData.js")
        print_and_log("Data successfully copied to test path")
    else:
        print_and_log(f"{test_path} test path not found, no data exported")


# ### Keep a record of each update for future time series use

# In[67]:


with open(f"logs/data_logs/state-{date_str}.json", 'w') as f:
    json.dump(state_json, f, cls=NpEncoder)


# In[68]:


with open(f"logs/data_logs/county-{date_str}.json", 'w') as f:
    json.dump(county_json, f, cls=NpEncoder)

