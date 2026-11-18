"""Tag 2 – Der Rattenfänger von Hameln (Pied Piper of Hamelin), Germany.

Facts used (Brüder Grimm, "Deutsche Sagen" Nr. 245 + Hamelin town tradition):
- 26 June 1284, 130 children of Hamelin disappeared
- town chronicle entry from 1384: "It is 100 years since our children left"
- the piper first came in colorful clothes, rats followed him into the Weser and drowned
- the town refused to pay; he returned dressed as a hunter
- children led out of the town gate into a mountain (Koppenberg)
- two came back: one blind, one mute
- Bungelosenstraße ("street without drums"): no music or dancing allowed to this day

Scene kinds marked NEW still have to be drawn in scenes.py before rendering.
"""

TITLE = "DER RATTENFÄNGER"
TITLE_SUB = "THE PIED PIPER OF HAMELIN"
LOCATION = "HAMELIN · GERMANY"

SCENES = [
    {"kind": "procession_night", "hook": True,             # NEW: line of tiny children silhouettes behind a piper
     "text": "In 1284, a hundred and thirty children followed a song… *and never came back.*"},
    {"kind": "town_records", "location": True,             # NEW: old town under moon, then chronicle page
     "text": "In the German town of *Hamelin*, this isn't just a fairy tale. It's written in the town's own records."},
    {"kind": "rats",                                       # NEW: rats swarming houses, eyes glinting
     "text": "That summer, the town was overrun by *rats.* They were everywhere. In the grain, in the houses… in the cradles."},
    {"kind": "title_piper", "title": True,                 # NEW: tall colorful stranger at the town gate
     "text": "Then a stranger arrived, dressed in many colors. *The Pied Piper.*"},
    {"kind": "bargain",                                    # NEW: piper vs. mayor, coins on a table
     "text": "He promised to rid the town of every rat… for a price."},
    {"kind": "rats_river",                                 # NEW: rats streaming into the moonlit Weser
     "text": "He played his pipe, and the rats *followed* him into the river. Every single one drowned."},
    {"kind": "refuse",                                     # NEW: mayor closing the purse, piper's face in shadow
     "text": "But the townspeople *refused to pay.*"},
    {"kind": "hunter_returns",                             # NEW: piper in dark hunter's clothes, red feather
     "text": "On the twenty-sixth of June, he returned. Dressed as a hunter. And he played a *different song.*"},
    {"kind": "children_follow",                            # NEW: children stepping out of doors, eyes closed
     "text": "This time, it wasn't the rats who followed. It was the *children.*"},
    {"kind": "mountain",                                   # NEW: procession through town gate into a glowing mountain
     "text": "A hundred and thirty of them danced through the streets, out of the town gate… and into a *mountain.*"},
    {"kind": "two_return",                                 # NEW: two small children alone on the road at dawn
     "text": "Only *two* came back. One was blind. The other couldn't speak."},
    {"kind": "silent_street",                              # NEW: empty narrow street, sign, silence
     "text": "To this day, there's a street in Hamelin where *no music* may be played."},
    {"kind": "pov_pipe",                                   # NEW: POV bedroom window, faint colorful figure below
     "text": "So if you ever hear a pipe playing at night, and your feet start to move on their own…"},
    {"kind": "piper_reveal", "hook": True,                 # NEW: piper's face reveal, pipe at his lips
     "text": "stop. *Don't follow the music.*"},
]
