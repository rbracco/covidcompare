import pandas as pd
import numpy as np
import json
from collections import defaultdict
import requests
import math
from pathlib import Path

def add_centroids(state_json):
    state_to_abbr = get_abbr_dict()
    with open(data_folder/"dataCovidState.json", 'r') as f:
        centroids_json = json.load(f)
    for state in state_json["features"]:
        state_id = state["id"]
        state["properties"]["lat"] = centroids_json[state_id]["LAT"]
        state["properties"]["long"] = centroids_json[state_id]["LONG"]
        state["properties"]["abbr"] = state_to_abbr[state["properties"]["name"]]

def add_covid_data(state_json):
    api_url = 'https://covidtracking.com/api/states'
    state_covid = requests.get(api_url).json()
    for state1 in state_covid:
        if(state1 == {}): continue
        for state2 in state_json["features"]:
            if(state1["state"] == state2["properties"]["abbr"]):
                state2["properties"]["testing"] = {}
                state2["properties"]["deaths"] = state1["death"]
                state2["properties"]["cases"] = state1["positive"]
                state2["properties"]["lastUpdateEt"] = state1["lastUpdateEt"]
                state2["properties"]["checkTimeEt"] = state1["checkTimeEt"]
                testing_keys = ["positive", "negative", "pending", "total"]
                for key in testing_keys:
                    state2["properties"]["testing"][key] = state1[key]


def add_local_risk(state_json):
    for state in state_json["features"]:
        if not state["properties"]["name"] == "Puerto Rico":
            state["properties"]["risk"] = {}
            state["properties"]["risk"]["LOCALRISK"] = calc_state_local_risk(state["properties"])

def add_neighbor_risk(state_json):
    for state in state_json["features"]:
        if not state["properties"]["name"] == "Puerto Rico":
            get_state_all_neighbor_risk(state["properties"])

def get_state_all_neighbor_risk(props):
    risk_details = {}
    for state in state_json["features"]:
        if not state["properties"]["name"] == "Puerto Rico":
            neighbor_props = state["properties"]
            neighbor_risk = get_state_neighbor_risk(props, neighbor_props)
            if(neighbor_risk != {}): 
                risk_details[neighbor_props["abbr"]] = neighbor_risk
    props["risk"]["NEIGHBORRISK"] = calc_state_neighbor_risk(risk_details)/props["population"]
    props["risk"]["TOTALRISK"] = props["risk"]["NEIGHBORRISK"] + props["risk"]["LOCALRISK"]

def calc_state_neighbor_risk(risks):
    num_risks = len(risks)
    total_neighbor_risk = 0
    for risk in risks.values():
        distance, neighbor_cases = risk.values()
        total_neighbor_risk += float(neighbor_cases)*(2**(-1*math.log2(float(distance))))
    return total_neighbor_risk

def get_state_neighbor_risk(props, neighbor_props):
    neighbor_centroid = [neighbor_props["lat"], neighbor_props["long"]]
    neighbor_cases = neighbor_props["cases"]
    centroid = [props["lat"], props["long"]]
    distance = get_distance(centroid, neighbor_centroid)
    if(props["abbr"] == neighbor_props["abbr"] or neighbor_cases == "NaN"):
        return {}
    else:
        return {"DISTANCE":distance, "CASES":neighbor_cases}

def calc_state_local_risk(props):
    cases = props["cases"]
    population = props.get("population", -1)
    if cases == 'NaN': cases = 0
    return cases/population if population != -1 else -1

#111 is to convert degrees to kilometers
def get_distance(c0, c1):
    lat_dist = abs(c0[0])-abs(c1[0])
    lng_dist = abs(c0[1])-abs(c1[1])
    distance = 111 * math.sqrt(lat_dist**2 + lng_dist**2)
    return distance

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

def export_js_and_json(state_json):

    with open("../states.json", 'w') as f:
        json.dump(state_json, f, cls=NpEncoder)

    with open("../stateData.js", 'w') as f:
        f.write("let stateData = ")
        json.dump(state_json, f, cls=NpEncoder)

def get_abbr_dict():
    return {
        'Alabama': 'AL',
        'Alaska': 'AK',
        'Arizona': 'AZ',
        'Arkansas': 'AR',
        'California': 'CA',
        'Colorado': 'CO',
        'Connecticut': 'CT',
        'Delaware': 'DE',
        'District of Columbia': 'DC',
        'Florida': 'FL',
        'Georgia': 'GA',
        'Hawaii': 'HI',
        'Idaho': 'ID',
        'Illinois': 'IL',
        'Indiana': 'IN',
        'Iowa': 'IA',
        'Kansas': 'KS',
        'Kentucky': 'KY',
        'Louisiana': 'LA',
        'Maine': 'ME',
        'Maryland': 'MD',
        'Massachusetts': 'MA',
        'Michigan': 'MI',
        'Minnesota': 'MN',
        'Mississippi': 'MS',
        'Missouri': 'MO',
        'Montana': 'MT',
        'Nebraska': 'NE',
        'Nevada': 'NV',
        'New Hampshire': 'NH',
        'New Jersey': 'NJ',
        'New Mexico': 'NM',
        'New York': 'NY',
        'North Carolina': 'NC',
        'North Dakota': 'ND',
        'Northern Mariana Islands':'MP',
        'Ohio': 'OH',
        'Oklahoma': 'OK',
        'Oregon': 'OR',
        'Palau': 'PW',
        'Pennsylvania': 'PA',
        'Puerto Rico': 'PR',
        'Rhode Island': 'RI',
        'South Carolina': 'SC',
        'South Dakota': 'SD',
        'Tennessee': 'TN',
        'Texas': 'TX',
        'Utah': 'UT',
        'Vermont': 'VT',
        'Virgin Islands': 'VI',
        'Virginia': 'VA',
        'Washington': 'WA',
        'West Virginia': 'WV',
        'Wisconsin': 'WI',
        'Wyoming': 'WY',
    }

if __name__ == "__main__":
    data_folder = Path('.')
    with open(data_folder/"usStates.json", 'r') as f:
        state_json = json.load(f)
    add_centroids(state_json)
    add_covid_data(state_json)
    add_local_risk(state_json)
    add_neighbor_risk(state_json)
    export_js_and_json(state_json)