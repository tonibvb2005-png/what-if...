"""Video 9 – The Banshee (bean sí), Ireland.

Facts used (Irish folklore):
- a female spirit whose wailing/keening outside a house foretells a death in the family
- she does not cause the death, she announces it
- described as a pale woman with long (often silver/white) hair and eyes red from weeping
- she combs her hair with a silver comb; finding a comb on the ground and picking it up
  is said to bring her back to reclaim it

Short format, implicit, no numbers. Scene kinds marked NEW still have to be drawn.
"""

TITLE = "THE BANSHEE"
TITLE_SUB = "SHE SCREAMS BEFORE SOMEONE DIES"
LOCATION = "COUNTY KERRY · IRELAND"

SCENES = [
    {"kind": "bs_hook", "hook": True,             # NEW: cottage window at night, pale figure outside in the mist
     "text": "If you hear a woman crying outside your window at night… *don't open it.*"},
    {"kind": "bs_ireland", "location": True,      # NEW: Irish cliffs, stone walls, lone cottage with lit window
     "text": "In *Ireland*, for hundreds of years, families have feared one sound more than any other."},
    {"kind": "bs_title", "title": True,           # NEW: banshee silhouette on a hill, hair blowing, moon
     "text": "The scream of *the Banshee.*"},
    {"kind": "bs_face",                           # NEW: pale face, long silver hair, red-rimmed eyes
     "text": "She appears as a pale woman with long silver hair… and eyes red from *crying.*"},
    {"kind": "bs_warns",                          # NEW: she points at a cottage, candle inside flickers
     "text": "She doesn't kill. *She warns.*"},
    {"kind": "bs_scream",                         # NEW: scream: windows shake, candle goes out
     "text": "When she screams outside a house, *someone inside* won't live to see the morning."},
    {"kind": "bs_comb",                           # NEW: close-up: silver comb through long hair, moonlight
     "text": "People say she combs her long hair with a *silver comb.*"},
    {"kind": "bs_road_comb",                      # NEW: comb lying on a wet country road, a hand reaching
     "text": "And if you ever find that comb lying on the road… *never pick it up.*"},
    {"kind": "bs_returns",                        # NEW: fog rolling in, figure approaching the house
     "text": "Because she *always* comes back for it."},
    {"kind": "bs_pov",                            # NEW: POV bedroom, crying outside, comb on the windowsill
     "text": "So tonight, if you hear soft crying outside, and you notice an old silver comb on your windowsill…"},
    {"kind": "bs_reveal", "hook": True,           # NEW: jump scare: screaming face at the window
     "text": "*she's already here.*"},
]
