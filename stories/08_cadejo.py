"""Video 8 – El Cadejo, Central America (Guatemala, El Salvador, Honduras, Nicaragua).

Facts used (Central American folklore):
- two dog-like spirits roam the roads at night: a white Cadejo that protects late travelers
  and a black Cadejo that is evil and pursues them
- huge dog with glowing red eyes, goat hooves instead of paws, often heard dragging chains
- it follows people who are out late; some say its touch drives people mad, others that they vanish

Short format, implicit, no numbers. Scene kinds marked NEW still have to be drawn.
"""

TITLE = "EL CADEJO"
TITLE_SUB = "THE DOG THAT FOLLOWS YOU HOME"
LOCATION = "GUATEMALA · EL SALVADOR"

SCENES = [
    {"kind": "cj_hook", "hook": True,             # NEW: cobblestone village street, two red eyes behind a walker
     "text": "If a dog with burning red eyes starts following you home at night… *pray it's white.*"},
    {"kind": "cj_roads", "location": True,        # NEW: volcano silhouette, colonial church, empty road under moon
     "text": "In *Central America*, they say two spirits walk the dark roads after midnight."},
    {"kind": "cj_title", "title": True,           # NEW: white dog and black dog facing each other on the road
     "text": "Both look like huge dogs. They're called *El Cadejo.*"},
    {"kind": "cj_white",                          # NEW: glowing white dog walking beside a traveler, soft light
     "text": "The white one protects lonely travelers. It walks beside you… and keeps the *darkness* away."},
    {"kind": "cj_black",                          # NEW: the black one stepping out of the shadows
     "text": "But the black one… *hunts.*"},
    {"kind": "cj_eyes",                           # NEW: close-up: ember eyes, then goat hooves on stones
     "text": "Its eyes glow like *embers.* Instead of paws, it has the hooves of a goat."},
    {"kind": "cj_chains",                         # NEW: chains dragging over cobblestones, sparks
     "text": "And when it walks, you hear *chains*… dragging over the stones."},
    {"kind": "cj_follow",                         # NEW: walker in a narrow street, the shape closing in silently
     "text": "It follows people who are out too late. It never makes a sound… until it's *right behind you.*"},
    {"kind": "cj_vanish",                         # NEW: empty street, only a lantern lying on the ground
     "text": "Some say if it touches you, you lose your mind. Others say you simply *disappear.*"},
    {"kind": "cj_pov",                            # NEW: POV walking home, long shadow, chain sound behind
     "text": "So if you're walking home at night, and you hear chains behind you…"},
    {"kind": "cj_reveal", "hook": True,           # NEW: jump scare: black Cadejo snarling, ember eyes
     "text": "*don't run. It only chases what runs.*"},
]
