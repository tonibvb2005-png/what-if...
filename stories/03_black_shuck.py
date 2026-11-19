"""Tag 3 – Black Shuck, East Anglia (Norfolk / Suffolk), England.

Facts used:
- East Anglian folklore: huge black dog with burning eyes, roams lonely roads, coast paths, churchyards
- seeing him is said to mean death within the year
- name commonly derived from Old English "scucca" = demon / devil
- 4 August 1577: during a violent thunderstorm a black dog appeared in St Mary's Church, Bungay;
  two people kneeling in prayer died (Abraham Fleming, "A Straunge and Terrible Wunder", 1577)
- same day at Holy Trinity Church, Blythburgh: the steeple fell through the roof;
  scorch marks on the north door ("the devil's fingerprints") can still be seen today

Rule: all numbers spelled out in English (TTS).
Scene kinds marked NEW still have to be drawn before rendering.
"""

TITLE = "BLACK SHUCK"
TITLE_SUB = "THE DEVIL'S DOG OF EAST ANGLIA"
LOCATION = "SUFFOLK · ENGLAND"

SCENES = [
    {"kind": "shuck_road", "hook": True,               # NEW: lonely road, two burning eyes far ahead in the dark
     "text": "If you see a black dog with burning eyes on a lonely road… *you won't live the year.*"},
    {"kind": "coast_road", "location": True,           # NEW: coastal marsh road, lighthouse, sea under the moon
     "text": "In the east of *England*, along the dark coast roads, people have feared this dog for centuries."},
    {"kind": "title_shuck", "title": True,              # NEW: huge dog silhouette on a churchyard wall, moon behind
     "text": "They call him *Black Shuck.* His name comes from an old word for demon."},
    {"kind": "shuck_closeup",                           # NEW: close-up shaggy head, eyes igniting red
     "text": "He's as big as a horse. His fur is black as night… and his eyes burn like *fire.*"},
    {"kind": "walk_beside",                             # NEW: traveler on a road, the dog silently walking next to him
     "text": "He walks beside lonely travelers, without a single sound. No footsteps. *No breath.*"},
    {"kind": "storm_town",                              # NEW: small market town, lightning, rain
     "text": "But on the fourth of August, fifteen seventy-seven, a terrible *storm* hit the town of Bungay."},
    {"kind": "church_doors",                            # NEW: church interior, people praying, doors burst open
     "text": "The people ran into the church to pray. Then, the doors *flew open.*"},
    {"kind": "church_dog",                              # NEW: black dog running down the aisle between candles
     "text": "A *black dog* ran between them, through the darkness of the church."},
    {"kind": "prayer_victims",                          # NEW: two kneeling figures, candles blown out
     "text": "Two people kneeling in prayer *died* where they knelt."},
    {"kind": "steeple_collapse",                        # NEW: second church, lightning, steeple falling
     "text": "That same day, he appeared in another church, in *Blythburgh.* The steeple crashed through the roof."},
    {"kind": "claw_door",                               # NEW: dog clawing the wooden door, sparks / burning
     "text": "And as he left, he burned his *claw marks* into the door."},
    {"kind": "scorch_marks",                            # NEW: present day: old door with black scorch marks, a hand
     "text": "Those marks are still there *today.* You can touch them."},
    {"kind": "pov_padding",                             # NEW: POV night road, faint shape keeping pace at the edge
     "text": "So if you're ever walking a lonely road at night, and you hear something padding beside you…"},
    {"kind": "shuck_reveal", "hook": True,              # NEW: jump scare: snarling dog face, burning eyes
     "text": "don't turn your head. *Never meet its eyes.*"},
]
