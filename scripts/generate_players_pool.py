import os
import json
import zipfile
import urllib.request
from collections import defaultdict

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'data_cache')
ZIP_PATH = os.path.join(CACHE_DIR, 'ipl_male_json.zip')
CRICSHEET_URL = 'https://cricsheet.org/downloads/ipl_male_json.zip'
OUTPUT_JSON = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'samplePlayerPool.json')

# Known overseas players dictionary for accurate nationality mapping
OVERSEAS_PLAYERS = {
    "Jos Buttler": "England", "Travis Head": "Australia", "Heinrich Klaasen": "South Africa",
    "Nicholas Pooran": "West Indies", "Sunil Narine": "West Indies", "Andre Russell": "West Indies",
    "Rashid Khan": "Afghanistan", "Pat Cummins": "Australia", "Mitchell Starc": "Australia",
    "Marcus Stoinis": "Australia", "Glenn Maxwell": "Australia", "Faf du Plessis": "South Africa",
    "Quinton de Kock": "South Africa", "Kagiso Rabada": "South Africa", "Anrich Nortje": "South Africa",
    "Trent Boult": "New Zealand", "Kane Williamson": "New Zealand", "Rachin Ravindra": "New Zealand",
    "Daryl Mitchell": "New Zealand", "Devon Conway": "New Zealand", "Mitchell Santner": "New Zealand",
    "Matheesha Pathirana": "Sri Lanka", "Wanindu Hasaranga": "Sri Lanka", "Maheesh Theekshana": "Sri Lanka",
    "Rahmanullah Gurbaz": "Afghanistan", "Noor Ahmad": "Afghanistan", "Fazalhaq Farooqi": "Afghanistan",
    "Naveen-ul-Haq": "Afghanistan", "Azmatullah Omarzai": "Afghanistan", "Mohammad Nabi": "Afghanistan",
    "David Warner": "Australia", "Steve Smith": "Australia", "Josh Hazlewood": "Australia",
    "Tim David": "Australia", "Adam Zampa": "Australia", "Spencer Johnson": "Australia",
    "Nathan Ellis": "Australia", "Jhye Richardson": "Australia", "Lance Morris": "Australia",
    "Liam Livingstone": "England", "Sam Curran": "England", "Phil Salt": "England",
    "Moeen Ali": "England", "Will Jacks": "England", "Reece Topley": "England",
    "Gus Atkinson": "England", "Tom Curran": "England", "Luke Wood": "England",
    "Shimron Hetmyer": "West Indies", "Rovman Powell": "West Indies", "Alzarri Joseph": "West Indies",
    "Romario Shepherd": "West Indies", "Shai Hope": "West Indies", "Kyle Mayers": "West Indies",
    "Jason Holder": "West Indies", "Sherfane Rutherford": "West Indies", "Obed McCoy": "West Indies",
    "David Miller": "South Africa", "Marco Jansen": "South Africa", "Tristan Stubbs": "South Africa",
    "Gerald Coetzee": "South Africa", "Lungi Ngidi": "South Africa", "Rilee Rossouw": "South Africa",
    "Nandre Burger": "South Africa", "Donovan Ferreira": "South Africa", "Wiaan Mulder": "South Africa",
    "Lockie Ferguson": "New Zealand", "Glenn Phillips": "New Zealand", "Matt Henry": "New Zealand",
    "Tim Seifert": "New Zealand", "Ish Sodhi": "New Zealand", "Mustafizur Rahman": "Bangladesh",
    "Shakib Al Hasan": "Bangladesh", "Taskin Ahmed": "Bangladesh", "Sikandar Raza": "Zimbabwe",
    "Joshua Little": "Ireland", "Paul Stirling": "Ireland"
}

# Known IPL team mapping for premier players
PREVIOUS_TEAMS = {
    "Virat Kohli": "RCB", "Rohit Sharma": "MI", "Jasprit Bumrah": "MI", "MS Dhoni": "CSK",
    "Ravindra Jadeja": "CSK", "Rishabh Pant": "DC", "KL Rahul": "LSG", "Shreyas Iyer": "KKR",
    "Hardik Pandya": "MI", "Suryakumar Yadav": "MI", "Shubman Gill": "GT", "Yashasvi Jaiswal": "RR",
    "Sanju Samson": "RR", "Ruturaj Gaikwad": "CSK", "Rinku Singh": "KKR", "Shivam Dube": "CSK",
    "Kuldeep Yadav": "DC", "Mohammed Siraj": "RCB", "Arshdeep Singh": "PBKS", "Axar Patel": "DC",
    "Yuzvendra Chahal": "RR", "Mohammed Shami": "GT", "Varun Chakaravarthy": "KKR", "Harshal Patel": "PBKS",
    "Jos Buttler": "RR", "Travis Head": "SRH", "Heinrich Klaasen": "SRH", "Nicholas Pooran": "LSG",
    "Sunil Narine": "KKR", "Andre Russell": "KKR", "Rashid Khan": "GT", "Pat Cummins": "SRH",
    "Mitchell Starc": "KKR", "Marcus Stoinis": "LSG", "Glenn Maxwell": "RCB", "Faf du Plessis": "RCB",
    "Quinton de Kock": "LSG", "Kagiso Rabada": "PBKS", "Trent Boult": "RR", "Matheesha Pathirana": "CSK"
}

# Wicketkeepers list
WICKETKEEPERS = {
    "Rishabh Pant", "Sanju Samson", "KL Rahul", "MS Dhoni", "Ishan Kishan", "Jitesh Sharma",
    "Dhruv Jurel", "Prabhsimran Singh", "Anuj Rawat", "Srikar Bharat", "Abishek Porel",
    "Kumar Kushagra", "Robin Uthappa", "Dinesh Karthik", "Wriddhiman Saha", "Jos Buttler",
    "Heinrich Klaasen", "Nicholas Pooran", "Quinton de Kock", "Phil Salt", "Rahmanullah Gurbaz",
    "Devon Conway", "Shai Hope", "Tristan Stubbs", "Tim Seifert", "Donovan Ferreira"
}

# Uncapped players heuristic override
KNOWN_UNCAPPED = {
    "Rinku Singh", "Abhishek Sharma", "Harshit Rana", "Nitish Kumar Reddy", "Mayank Yadav",
    "Yash Dayal", "Shahrukh Khan", "Ashutosh Sharma", "Shashank Singh", "Prabhsimran Singh",
    "Abishek Porel", "Sameer Rizvi", "Kumar Kushagra", "Suyash Sharma", "Nehal Wadhera",
    "Tilak Varma", "Angkrish Raghuvanshi", "Rasikh Salam", "Ramandeep Singh", "Vaibhav Arora",
    "Anuj Rawat", "Mahipal Lomror", "Raj Bawa", "Vyshak Vijay Kumar", "Vidwath Kaverappa",
    "Deepak Chahar", "Tushar Deshpande", "Mukesh Choudhary", "Simarjeet Singh", "Hangargekar",
    "Ayush Badoni", "Mohsin Khan", "Yash Thakur", "Mayank Dagar", "Kumar Kartikeya"
}

def ensure_cricsheet_data():
    os.makedirs(CACHE_DIR, exist_ok=True)
    if not os.path.exists(ZIP_PATH):
        print(f"Downloading Cricsheet IPL JSON data from {CRICSHEET_URL}...")
        urllib.request.urlretrieve(CRICSHEET_URL, ZIP_PATH)
        print("Download complete.")
    else:
        print("Using cached Cricsheet IPL JSON zip.")

def parse_cricsheet_stats():
    ensure_cricsheet_data()

    player_stats = defaultdict(lambda: {
        'bat_matches': set(),
        'bowl_matches': set(),
        'all_matches': set(),
        'runs': 0,
        'balls_faced': 0,
        'outs': 0,
        'fours': 0,
        'sixes': 0,
        'highest_score': 0,
        'highest_score_notout': False,
        'match_scores': [],
        'legal_balls_bowled': 0,
        'runs_conceded': 0,
        'wickets': 0,
        'best_bowling_wickets': 0,
        'best_bowling_runs': 999,
        'recent_team': None,
    })

    with zipfile.ZipFile(ZIP_PATH, 'r') as z:
        file_list = [f for f in z.namelist() if f.endswith('.json')]
        print(f"Processing {len(file_list)} IPL matches from Cricsheet dataset...")

        for idx, filename in enumerate(file_list):
            try:
                with z.open(filename) as f:
                    data = json.load(f)

                match_id = filename.replace('.json', '')
                info = data.get('info', {})
                innings_list = data.get('innings', [])

                match_batsmen_runs = defaultdict(int)
                match_batsmen_outs = defaultdict(bool)

                for innings in innings_list:
                    team_name = innings.get('team')
                    for overs_data in innings.get('overs', []):
                        for delivery in overs_data.get('deliveries', []):
                            batter = delivery.get('batter')
                            bowler = delivery.get('bowler')
                            runs_data = delivery.get('runs', {})
                            batter_runs = runs_data.get('batter', 0)
                            total_runs = runs_data.get('total', 0)
                            extras = delivery.get('extras', {})

                            # Track match appearance
                            player_stats[batter]['all_matches'].add(match_id)
                            player_stats[batter]['bat_matches'].add(match_id)
                            player_stats[bowler]['all_matches'].add(match_id)
                            player_stats[bowler]['bowl_matches'].add(match_id)

                            if team_name:
                                player_stats[batter]['recent_team'] = team_name

                            # Batting stats
                            player_stats[batter]['runs'] += batter_runs
                            match_batsmen_runs[batter] += batter_runs

                            # Extras ball count logic
                            if 'wides' not in extras:
                                player_stats[batter]['balls_faced'] += 1

                            if batter_runs == 4:
                                player_stats[batter]['fours'] += 1
                            elif batter_runs == 6:
                                player_stats[batter]['sixes'] += 1

                            # Wicket logic
                            wickets = delivery.get('wickets', [])
                            for w in wickets:
                                player_out = w.get('player_out')
                                kind = w.get('kind', '')
                                if player_out:
                                    player_stats[player_out]['outs'] += 1
                                    match_batsmen_outs[player_out] = True

                                if kind not in ['run out', 'retired hurt', 'obstructing the field']:
                                    player_stats[bowler]['wickets'] += 1

                            # Bowling stats
                            if 'wides' not in extras and 'noballs' not in extras:
                                player_stats[bowler]['legal_balls_bowled'] += 1

                            # Bowling runs conceded (exclude unearned extras like byes/legbyes)
                            byes = extras.get('byes', 0) + extras.get('legbyes', 0)
                            player_stats[bowler]['runs_conceded'] += (total_runs - byes)

                # Track highest scores per match
                for b_name, b_runs in match_batsmen_runs.items():
                    is_out = match_batsmen_outs.get(b_name, False)
                    hs = player_stats[b_name]['highest_score']
                    if b_runs > hs:
                        player_stats[b_name]['highest_score'] = b_runs
                        player_stats[b_name]['highest_score_notout'] = not is_out

            except Exception as err:
                continue

    return player_stats

def shorten_team_name(full_name):
    if not full_name:
        return "IPL"
    mapping = {
        "Chennai Super Kings": "CSK",
        "Mumbai Indians": "MI",
        "Royal Challengers Bangalore": "RCB",
        "Royal Challengers Bengaluru": "RCB",
        "Kolkata Knight Riders": "KKR",
        "Sunrisers Hyderabad": "SRH",
        "Delhi Capitals": "DC",
        "Delhi Daredevils": "DC",
        "Rajasthan Royals": "RR",
        "Kings XI Punjab": "PBKS",
        "Punjab Kings": "PBKS",
        "Lucknow Super Giants": "LSG",
        "Gujarat Titans": "GT",
        "Deccan Chargers": "SRH",
        "Rising Pune Supergiant": "CSK",
        "Rising Pune Supergiants": "CSK",
        "Gujarat Lions": "GT",
        "Kochi Tuskers Kerala": "CSK"
    }
    return mapping.get(full_name, "IPL")

def build_player_pool():
    raw_stats = parse_cricsheet_stats()
    all_players = []

    print(f"Aggregated statistics for {len(raw_stats)} unique IPL players.")

    for name, stats in raw_stats.items():
        total_matches = len(stats['all_matches'])
        if total_matches < 3: # Filter out one-off trialists to build robust 500+ pool
            continue

        runs = stats['runs']
        balls_faced = stats['balls_faced']
        outs = stats['outs']
        wickets = stats['wickets']
        legal_balls = stats['legal_balls_bowled']
        runs_conceded = stats['runs_conceded']

        bat_avg = round(runs / outs, 2) if outs > 0 else float(runs)
        strike_rate = round((runs / balls_faced) * 100, 2) if balls_faced > 0 else 0.0
        overs = legal_balls / 6.0
        economy = round(runs_conceded / overs, 2) if overs > 0 else 0.0

        hs = stats['highest_score']
        hs_str = f"{hs}*" if stats['highest_score_notout'] else str(hs)

        # Nationality & Overseas
        country = OVERSEAS_PLAYERS.get(name, "India")
        is_overseas = country != "India"

        # Role determination
        if name in WICKETKEEPERS:
            role = "Wicketkeeper"
            sub_role = "Wicketkeeper-Batter"
        elif runs >= 400 and wickets >= 15:
            role = "All-rounder"
            sub_role = "Pace All-rounder" if wickets > 30 else "Spin All-rounder"
        elif wickets >= 20 or (wickets > runs // 15 and wickets >= 10):
            role = "Bowler"
            sub_role = "Fast Bowler" if (wickets > 25 or economy > 7.5) else "Spinner"
        else:
            role = "Batter"
            sub_role = "Top-order Batter" if bat_avg >= 28 else "Middle-order Batter"

        # Cap status
        is_uncapped = (name in KNOWN_UNCAPPED) or (total_matches < 15 and runs < 300 and wickets < 10 and not is_overseas)
        cap_status = "Uncapped" if is_uncapped else "Capped"

        # Previous team lookup
        prev_team = PREVIOUS_TEAMS.get(name) or shorten_team_name(stats['recent_team'])

        # Base price calculation
        if cap_status == "Capped":
            if runs >= 3000 or wickets >= 120 or name in PREVIOUS_TEAMS:
                base_price = 200
            elif runs >= 1500 or wickets >= 60:
                base_price = 150
            elif runs >= 800 or wickets >= 35:
                base_price = 100
            elif runs >= 400 or wickets >= 20:
                base_price = 75
            else:
                base_price = 50
        else:
            base_price = 40 if runs >= 500 or wickets >= 20 else 30

        # Create player object
        player_obj = {
            "id": f"player-{len(all_players) + 1:03d}",
            "name": name,
            "country": country,
            "is_overseas": is_overseas,
            "role": role,
            "sub_role": sub_role,
            "cap_status": cap_status,
            "age": 24 + (len(all_players) % 14),
            "batting_style": "Right-hand bat" if (len(all_players) % 3 != 0) else "Left-hand bat",
            "bowling_style": "Right-arm fast-medium" if role in ["Bowler", "All-rounder"] else None,
            "base_price_lakh": base_price,
            "set_name": "Pending",
            "set_order": 99,
            "previous_team": prev_team,
            "stats": {
                "matches": total_matches,
                "runs": runs,
                "batting_avg": bat_avg,
                "strike_rate": strike_rate,
                "wickets": wickets,
                "economy": economy,
                "hs": hs_str
            },
            "image_url": "", # Will use clean avatar component fallback
            "status": "pending"
        }
        all_players.append(player_obj)

    # Sort players by prominence and assign official Auction Sets
    all_players.sort(key=lambda p: (
        0 if p['cap_status'] == 'Capped' else 1,
        -p['stats']['runs'] - (p['stats']['wickets'] * 20)
    ))

    # Group into auction sets
    marquee_set_1 = []
    marquee_set_2 = []
    capped_batters = []
    capped_allrounders = []
    capped_wkeepers = []
    capped_fastbowlers = []
    capped_spinners = []
    uncapped_batters = []
    uncapped_allrounders = []
    uncapped_wkeepers = []
    uncapped_fastbowlers = []
    uncapped_spinners = []

    for p in all_players:
        if p['cap_status'] == 'Capped':
            if len(marquee_set_1) < 6 and p['base_price_lakh'] == 200:
                marquee_set_1.append(p)
            elif len(marquee_set_2) < 6 and p['base_price_lakh'] == 200:
                marquee_set_2.append(p)
            elif p['role'] == 'Batter':
                capped_batters.append(p)
            elif p['role'] == 'All-rounder':
                capped_allrounders.append(p)
            elif p['role'] == 'Wicketkeeper':
                capped_wkeepers.append(p)
            elif p['sub_role'] == 'Fast Bowler' or p['role'] == 'Bowler':
                capped_fastbowlers.append(p)
            else:
                capped_spinners.append(p)
        else:
            if p['role'] == 'Batter':
                uncapped_batters.append(p)
            elif p['role'] == 'All-rounder':
                uncapped_allrounders.append(p)
            elif p['role'] == 'Wicketkeeper':
                uncapped_wkeepers.append(p)
            elif p['sub_role'] == 'Fast Bowler' or p['role'] == 'Bowler':
                uncapped_fastbowlers.append(p)
            else:
                uncapped_spinners.append(p)

    final_pool = []
    set_order = 1

    def assign_set(list_players, base_name, order):
        chunk_size = 8
        for i in range(0, len(list_players), chunk_size):
            chunk = list_players[i:i + chunk_size]
            set_title = f"{base_name} { (i // chunk_size) + 1 }" if len(list_players) > chunk_size else base_name
            for p in chunk:
                p['set_name'] = set_title
                p['set_order'] = order
                final_pool.append(p)

    assign_set(marquee_set_1, "Marquee Set 1", 1)
    assign_set(marquee_set_2, "Marquee Set 2", 2)
    assign_set(capped_batters, "Capped Batters", 3)
    assign_set(capped_allrounders, "Capped All-Rounders", 4)
    assign_set(capped_wkeepers, "Capped Wicketkeepers", 5)
    assign_set(capped_fastbowlers, "Capped Fast Bowlers", 6)
    assign_set(capped_spinners, "Capped Spinners", 7)
    assign_set(uncapped_batters, "Uncapped Batters", 8)
    assign_set(uncapped_allrounders, "Uncapped All-Rounders", 9)
    assign_set(uncapped_wkeepers, "Uncapped Wicketkeepers", 10)
    assign_set(uncapped_fastbowlers, "Uncapped Fast Bowlers", 11)
    assign_set(uncapped_spinners, "Uncapped Spinners", 12)

    # Re-index player IDs sequentially
    for idx, p in enumerate(final_pool):
        p['id'] = f"player-{idx + 1:03d}"
        if idx == 0:
            p['status'] = 'nominated'
        else:
            p['status'] = 'pending'

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(final_pool, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated {len(final_pool)} real IPL players seed in {OUTPUT_JSON}!")
    return len(final_pool)

if __name__ == '__main__':
    build_player_pool()
