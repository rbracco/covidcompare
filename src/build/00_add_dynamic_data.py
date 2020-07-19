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
import datetime


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


# #### Convert decimal to percent for state hypertension

# In[4]:


for state in state_json["features"]:
    state["properties"]["comorbid_hypertension"] *= 100


# We make one request that will be parsed once for State Data and once for county

# In[5]:


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

# In[6]:


geo_id_index_dict = {}
counties = county_json["features"]
for idx, county in enumerate(counties):
    geo_id = county["properties"]["geo_id"]
    geo_id_index_dict[geo_id] = idx


# ### Setup logging

# In[7]:


now = datetime.datetime.now()
date_str = f"{now.month}-{now.day}-{now.year}-{now.hour}{now.minute}"


# In[8]:


logging.basicConfig(filename=f'logs/message_logs/{date_str}.log',level=logging.DEBUG)


# In[9]:


def print_and_log(message):
    logging.info(message)
    print(message)


# ## Add new data from APIs

# ### Add State Covid19 data from John's Hopkins

# In[10]:


#data from John Hopkins CSSE
api_url = "https://covid19.mathdro.id/api/countries/USA/confirmed"
covid_jh = request_multiple_attempts(api_url).json()


# #### Test that data appears to be valid

# In[11]:


# there should be at least 1700 counties
num_counties = len(covid_jh)
if (num_counties < 1700): raise ValueError("Only", num_counties, " counties found in Johns Hopkins data")
mandatory_keys = ['fips', 'confirmed', 'recovered', 'deaths', 'active', 'combinedKey', 'provinceState']
for key in mandatory_keys:
    if not key in covid_jh[120]: raise ValueError("John's Hopkins Record missing key: ", key)


# In[12]:


covid_jh[0].keys()


# In[13]:


#includes ms which fromtimestamp doesnt accept so we cut it off
def get_str_from_timestamp(timestamp):
    timestamp = int(str(timestamp)[:-3])
    cur = datetime.datetime.fromtimestamp(timestamp)
    return cur.strftime('%#m/%d %#I:%M%p')


# In[14]:


#initialize all state case data to 0
null_dict = {"cases":0, "deaths":0, "active":0, "recovered":0}
for state in state_json["features"]:
    state["properties"].update(null_dict)


# In[15]:


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


# In[16]:


def add_unassigned_to_state(statename, record):
    for state in state_json["features"]:
        props = state["properties"]
        if(props["statename"].lower() == statename.lower()):
            print_and_log(f'{record["confirmed"]} unassigned cases added to {statename}')
            print_and_log(f'{record["deaths"]} unassigned deaths added to {statename}')
            props["unassigned_cases"] = record["confirmed"]


# In[17]:


skips = ["Diamond Princess, US", "Guam, US", "Grand Princess, US", "Puerto Rico, US", "Virgin Islands, US", 
         'Northern Mariana Islands, US', 'Unassigned, Northern Mariana Islands, US']
for record in covid_jh:
    if(record == {}): continue
    if record["combinedKey"] in skips: continue
    try:
        county, state, _ = map(str.strip, record["combinedKey"].split(','))
    except ValueError:
        print("Skipping record", record)
    if county == "Unassigned":
        add_unassigned_to_state(state, record)
    add_record_to_state(record)


# ### Add County Covid Data19 from John's Hopkins
# 

# In[18]:


#initialize all county case data to 0
for county in counties:
    county["properties"].update(null_dict)


# In[19]:


skips = ["Diamond Princess, US", "Guam, US", "Grand Princess, US", "Puerto Rico, US", "Virgin Islands, US"]
missing_fips = {
    "Dona Ana,New Mexico,US":"35013", 
    "Kansas City,Missouri,US":"29095", 
    "Dukes and Nantucket,Massachusetts,US":"25007"
}


# In[20]:


def add_record_to_county(record):
    if("Unassigned" in record["combinedKey"]): return
    #sub in countyid for counties that have missing county id
    if(record["combinedKey"] in missing_fips): 
        record["fips"] = missing_fips[record["combinedKey"]]
    #skip anything without a countyID
    if(record['fips'] is None or record['fips'] in ['00078', '80015', '80040', '46102', '80013', 
                                                   '80047', '80026', '00069']):
        print_and_log(f'No geo_id, skipping {record["combinedKey"]}')
        return
    #skip anything in the skip list
    if(record["combinedKey"] in skips): return
    geo_id = '0500000US' + record["fips"]
    try:    
        county = counties[geo_id_index_dict[geo_id]]
        #Add the contents of record to the county
        for key in keys:
            county["properties"][key] += int(record[key])
        county["properties"]["cases"] += int(record["confirmed"])
        county["properties"]["time_cases_update"] = get_str_from_timestamp(record["lastUpdate"])
    except KeyError as e:
        print(f"FIPS '{record['fips']}' NOT FOUND, SKIPPING:")

# In[21]:


for record in covid_jh:
    add_record_to_county(record)


# #### Reassign NYC to the proper counties

# In[22]:


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


# In[23]:


# This is based on an estimate on 3/21/20 in which NYC had 5687 cases broken down as follows
# this has since been updated on 3/26/20 for data from here: 
# https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary.pdf
# https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary-deaths.pdf
# # Kings - 1750, Queens - 1514, New York 1402, Bronx 736, Richmond 285
cases_proportion_dict = {
    #code:proportion of NYC cases
    #queens
    '0500000US36081':.335515,
    #kings
    '0500000US36047':.269878,
    #Bronx
    '0500000US36005': .196217,
    #Richmond (Staten Island)
    '0500000US36085':.055885,
    #New York (Manhattan)
    '0500000US36061':.142502,
}
deaths_proportion_dict = {
    #code:proportion of NYC cases
    #queens
    '0500000US36081':.311893,
    #kings
    '0500000US36047':.270226,
    #Bronx
    '0500000US36005':.253640,
    #Richmond (Staten Island)
    '0500000US36085':.051779,
    #New York (Manhattan)
    '0500000US36061':.112055,
}
# #get cases that were all aggregated in NY county


# In[24]:


ny_county_names = {
    '0500000US36081':'Queens County',
    '0500000US36047':'Kings County',
    '0500000US36005':'Bronx County',
    '0500000US36085':'Richmond County',
    '0500000US36061':'Manhattan',
}


# In[25]:


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

# In[26]:


def format_test_time(test_time):
    d, h = test_time.split(' ')
    h, m = h.split(":")
    h = int(h)
    am_pm = "AM" if h <= 12 else "PM"
    if(am_pm) == "pm": h-=12
    return f"{d} {h}:{m}{am_pm}"


# In[27]:


#https://covidtracking.com/api/states/info <- this api has info about where the data comes from
api_url = 'https://covidtracking.com/api/states'
state_tests = request_multiple_attempts(api_url).json()


# #### Test that data appears to be valid

# In[28]:


# there should be at least 50 entries
num_states = len(state_tests)
if (num_states < 50): raise ValueError("Only", num_states, " states found in covidtracking testing data")
mandatory_keys = ['state', 'lastUpdateEt', 'positive', 'negative', 'total']
for key in mandatory_keys:
    if not key in state_tests[20]: raise ValueError("CovidTracking testing missing key: ", key)


# In[29]:


state_tests[20]


# In[30]:


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

# In[31]:


print_and_log("\nAdding per capita stats for county")
for county in counties:
    props = county["properties"]
    per_cap = props["population"]/100000
    props["pc_cases"] = props["cases"]/per_cap
    props["pc_deaths"] = props["deaths"]/per_cap


# In[32]:


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

# In[33]:


with open(county_data_folder/'countyTimeData.json', 'r') as f:
    county_time_data = json.load(f)


# #### Add today's data to time series

# Note we wont display this in time series until tomorrow becauseit makes it look like curve is flattening

# In[34]:


today = datetime.datetime.today()
todays_date = f"{today.month}-{today.day}-{today.year}"
print_and_log(f"Adding time series for today: {todays_date}")


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


# #### Save latest county time series data to file

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


state_time_data["Alabama"]


# In[43]:


for state in state_json["features"]:
    statename = state["properties"]["statename"]
    if statename in state_time_data.keys():
        state["properties"]["time_series"] = state_time_data[statename]


# #### Save latest state time series data to file

# In[44]:


state_json["features"][0]


# In[45]:


with open(state_data_folder/"stateTimeData.json", 'w') as f:
    json.dump(state_time_data, f)


# ## Calculate Risk

# ### Add in county risk

# In[46]:


#111 is to convert degrees to kilometers
def get_distance(c0, c1):
    lat_dist = abs(c0[0])-abs(c1[0])
    lng_dist = abs(c0[1])-abs(c1[1])
    distance = 111 * math.sqrt(lat_dist**2 + lng_dist**2)
    return float(distance)


# #### County Local Risk

# In[47]:


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


# In[48]:


print_and_log("\nCalculating local county risk")
for county in counties:
    county["properties"]["risk_local"] = calc_county_local_risk(county["properties"])


# #### County Neighbor Risk

# In[49]:


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


# In[50]:


def get_county_all_neighbor_risk(props):
    risk_details = {}
    for county in counties:
        neighbor_props = county["properties"]
        neighbor_risk = get_county_neighbor_risk(props, neighbor_props)
        if(neighbor_risk != {}): risk_details[neighbor_props["geo_id"]] = neighbor_risk
    props["risk_nearby"] = calc_county_neighbor_risk(risk_details)
    props["risk_total"] = props["risk_nearby"] + props["risk_local"]


# In[51]:


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


# In[52]:


print_and_log("\nCalculating local county risk")
for county in counties:
    get_county_all_neighbor_risk(county["properties"])


# ### Add in state risk

# ####  Local State Risk

# In[53]:


#111 is to convert degrees to kilometers
def get_distance(c0, c1):
    lat_dist = abs(c0[0])-abs(c1[0])
    lng_dist = abs(c0[1])-abs(c1[1])
    distance = 111 * math.sqrt(lat_dist**2 + lng_dist**2)
    return distance


# In[54]:


def calc_state_local_risk(props):
    #changed from props["active"] change back when possible
    cases = props["cases"]
    population = props.get("population", -1)
    if cases == 'NaN': cases = 0
    return cases/(population/100000) if population != -1 else -1


# In[55]:


print_and_log("Calculating local state risk")
for state in state_json["features"]:
    state["properties"]["risk_local"] = calc_state_local_risk(state["properties"])


# #### Neighbor State Risk

# In[56]:


def get_state_all_neighbor_risk(props):
    risk_details = {}
    for state in state_json["features"]:
        neighbor_props = state["properties"]
        neighbor_risk = get_state_neighbor_risk(props, neighbor_props)
        if(neighbor_risk != {}): 
            risk_details[neighbor_props["abbr"]] = neighbor_risk
    props["risk_nearby"] = calc_state_neighbor_risk(risk_details)
    props["risk_total"] = props["risk_nearby"] + props["risk_local"]


# In[57]:


def calc_state_neighbor_risk(risks):
    num_risks = len(risks)
    total_neighbor_risk = 0
    for risk in risks.values():
        distance, neighbor_cases, neighbor_pop = risk.values()
        total_neighbor_risk += (neighbor_cases*(2**((-distance-150)/50)))
    return total_neighbor_risk


# In[58]:


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


# In[59]:


print_and_log("Calculating neighbor state risk\n")
for state in state_json["features"]:
    get_state_all_neighbor_risk(state["properties"])


# ## Add daily change to states

# In[60]:


def get_date_string(d):
    return f"{d.month}-{d.day}-{d.year}"


# In[61]:


today = datetime.datetime.today()
yesterday = today - datetime.timedelta(days=1)
back_0 = get_date_string(yesterday)
back_1 = get_date_string(yesterday - datetime.timedelta(days=1))
back_3 = get_date_string(yesterday - datetime.timedelta(days=3))
back_7 = get_date_string(yesterday - datetime.timedelta(days=7))


# In[62]:


def add_change(state_or_county, feature_name, save_name):
    try:
        latest = state_or_county["properties"]["time_series"][back_0][feature_name]
    except KeyError:
        latest = 0
    try:
        minus1d = state_or_county["properties"]["time_series"][back_1][feature_name]
    except KeyError:
        minus1d = 0
    try:
        minus3d = state_or_county["properties"]["time_series"][back_3][feature_name]
    except KeyError:
        minus3d = 0 
    try:
        minus7d = state_or_county["properties"]["time_series"][back_7][feature_name]
    except KeyError:
        minus7d = 0 
        
    if(latest == 0): percent_growth1d = percent_growth3d = percent_growth7d = "N/A"
    else:
        percent_growth1d = (latest)/minus1d if minus1d != 0 else "N/A"
        percent_growth3d = ((latest)/minus3d)**(1/3) if minus3d != 0 else "N/A"
        percent_growth7d = ((latest)/minus7d)**(1/7) if minus7d != 0 else "N/A"
    state_or_county["properties"][save_name + "24hr"] = percent_growth1d
    state_or_county["properties"][save_name + "72hr"] = percent_growth3d
    state_or_county["properties"][save_name + "1w"] = percent_growth7d


# In[63]:


for state in state_json["features"]:
    add_change(state, "cases", "growth_cases")
    add_change(state, "deaths", "growth_deaths")
    add_change(state, "test_total", "growth_tests")


# In[64]:


for county in county_json["features"]:
    add_change(county, "cases", "growth_cases")
    add_change(county, "deaths", "growth_deaths")


# In[65]:


county_json["features"][1441]


# ## Add state rank data

# In[66]:


def add_state_rank(feature_name, rank_name):
    case_num = []
    for state in state_json["features"]:
        case_num.append(state["properties"][feature_name])
    ordered = sorted(case_num, reverse=True)
    for state in state_json["features"]:
        state["properties"][rank_name] = ordered.index(state["properties"][feature_name]) + 1


# In[67]:


add_state_rank("pc_cases", "rank_cases")
add_state_rank("pc_deaths", "rank_deaths")
add_state_rank("pc_tests", "rank_tests")
add_state_rank("risk_total", "rank_risk_total")


# ## Add county rank data

# In[68]:


def add_county_rank(feature_name, rank_name):
    case_num = []
    for county in county_json["features"]:
        case_num.append(county["properties"][feature_name])
    ordered = sorted(case_num, reverse=True)
    for county in county_json["features"]:
        county["properties"][rank_name] = ordered.index(county["properties"][feature_name]) + 1


# In[69]:


def get_counties_in_state(statename):
    return list(filter(lambda x: is_in_state(x, statename), county_json["features"]))

def is_in_state(county, statename):
    return county["properties"]["statename"] == statename


# In[70]:


def add_county_state_rank(feature_name, rank_name):
    for state in state_json["features"]:
        statename = state["properties"]["statename"]
        i = 0
        case_num = []
        counties_in_state = get_counties_in_state(statename)
        num_counties = len(counties_in_state)
        for county in counties_in_state:
            case_num.append(county["properties"][feature_name])
        ordered = sorted(case_num, reverse=True)
        for county in counties_in_state:
            county["properties"][rank_name] = ordered.index(county["properties"][feature_name]) + 1
            county["properties"]["num_counties_statewide"] = num_counties


# In[71]:


add_county_rank("pc_cases", "rank_cases")
add_county_rank("pc_deaths", "rank_deaths")
add_county_rank("risk_total", "rank_risk_total")


# In[72]:


add_county_state_rank("pc_cases", "rank_cases_state")
add_county_state_rank("pc_deaths", "rank_deaths_state")
add_county_state_rank("risk_total", "rank_risk_total_state")


# In[73]:


state_json["features"][0]["properties"]


# In[74]:


county_json["features"][0]["properties"]


# ## View Output

# In[75]:


county_json["features"][408]


# In[76]:


state_json["features"][0]


# In[77]:


for county in county_json["features"]:
    if county["properties"]["geo_id"] == "0500000US36061": 
        for k, v in county["properties"]["time_series"].items():
            print(k,v)


# ## Calculate US data in total

# In[78]:


us_json = {"properties":
                {
                    "population":0,
                    "beds":0,
                    "population_density":94,
                    "age0-19":0,
                    'age20-44': 0,
                     'age45-54': 0,
                     'age55-64': 0,
                     'age65-74': 0,
                     'age75-84': 0,
                     'age85+': 0,
                     'comorbid_obesity': 39.8,
                     'comorbid_hypertension': 33.2,
                     'comorbid_diabetes': 10.5,
                     'comorbid_cancer': .448,
                     'comorbid_smoking': 15.7,
                     'cases': 0,
                     'deaths': 0,
                     'active': 0,
                     'recovered': 0,
                     'test_grade': 'N/A',
                     'test_positive': 0,
                     'test_negative': 0,
                     'test_total': 0,
                     'risk_local':'N/A',
                     'risk_total':'N/A',
                     'risk_nearby':'N/A',
                     'rank_cases': 'N/A',
                     'rank_deaths': 'N/A',
                     'rank_tests': 'N/A',
                     'rank_risk_total': 'N/A'
                }
              
          }


# In[79]:


summable_keys = ["population", "beds", "age0-19", "age20-44", "age45-54", "age55-64", "age65-74", "age75-84", "age85+",
                "cases", "deaths", "active", "recovered", "test_positive", "test_negative", "test_total"]
for state in state_json["features"]:
    props = state["properties"]
    if props["statename"] == "Puerto Rico": continue
    for key in summable_keys:
        us_json["properties"][key] += props[key]
    if "unassigned_cases" in props: us_json["properties"]["cases"] += props["unassigned_cases"]
    if "unassigned_deaths" in props: us_json["properties"]["deaths"] += props["unassigned_deaths"]


# ### Add Percapita data

# In[80]:


us_pop = us_json["properties"]["population"]
us_json["properties"]["pc_cases"] = us_json["properties"]["cases"]/(us_pop/100000)
us_json["properties"]["pc_deaths"] = us_json["properties"]["deaths"]/(us_pop/100000)
us_json["properties"]["pc_active"] = us_json["properties"]["active"]/(us_pop/100000)
us_json["properties"]["pc_tests"] = us_json["properties"]["test_total"]/(us_pop/100000)


# ### Add time series data

# In[81]:


us_time_series = {}
for state in state_json["features"]:
    for date, values in state["properties"]["time_series"].items():
        if not date in us_time_series:
            us_time_series[date] = defaultdict(int)
        for k, v in values.items():
            addend = v if v is not None else 0
            us_time_series[date][k] += addend


# In[82]:


us_json["properties"]["time_series"] = us_time_series


# In[83]:


state["properties"]["time_series"]


# In[84]:


us_json


# ### Add in daily changes in cases/deaths

# In[85]:


add_change(us_json, "cases", "growth_cases")
add_change(us_json, "deaths", "growth_deaths")


# ## Export

# In[86]:


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
    
with open("USData.js", 'w') as f:
    f.write("let USData = ")
    json.dump(us_json, f, cls=NpEncoder)    
    
with open("counties.json", 'w') as f:
    json.dump(county_json, f, cls=NpEncoder)

with open("countyData.js", 'w') as f:
    f.write("let countyData = ")
    json.dump(county_json, f, cls=NpEncoder)


# In[87]:


live_path = Path("/var/www/html/data")
test_path = Path("../data")
if(live_path.exists()):
    print_and_log("Copying data to the /var/www/html")
    shutil.copy("stateData.js", live_path/"stateData.js")
    shutil.copy("countyData.js", live_path/"countyData.js")
    shutil.copy("USData.js", live_path/"USData.js")
    shutil.copy("counties.json", live_path/"counties.json")
    shutil.copy("states.json", live_path/"states.json")
    print_and_log("Data successfully copied to live path")
else:
    print_and_log(f"{live_path} not found, NOT COPYING DATA")
    if(test_path.exists()):
        print_and_log("Copying data to the test path")
        shutil.copy("stateData.js", test_path/"stateData.js")
        shutil.copy("countyData.js", test_path/"countyData.js")
        shutil.copy("USData.js", test_path/"USData.js")
        print_and_log("Data successfully copied to test path")
    else:
        print_and_log(f"{test_path} test path not found, no data exported")


# In[88]:


us_json


# ### Keep a record of each update for future time series use

# In[89]:


with open(f"logs/data_logs/state-{date_str}.json", 'w') as f:
    json.dump(state_json, f, cls=NpEncoder)


# In[90]:


with open(f"logs/data_logs/county-{date_str}.json", 'w') as f:
    json.dump(county_json, f, cls=NpEncoder)


# In[ ]:




