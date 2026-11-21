"""Video 6 – Teke Teke, Japan (urban legend).

Facts used (common versions of the Japanese urban legend):
- a girl falls (or is pushed) onto railway tracks on a freezing winter night and is cut in half by a train
- the cold freezes her wounds, she does not die at once but crawls, searching for her lower body
- her vengeful spirit haunts stations and tracks at night, dragging her upper body on her elbows/hands
- "teke teke" is the scraping sound she makes; she is far faster than a running person
- some versions: she asks "Where are my legs?"; with a wrong answer she cuts the victim in half
  (often with a scythe) so they end up like her

Wording kept implicit (no graphic injury words): ElevenLabs' content filter blocked the first,
more graphic version.
Short format: max ~160 words, a scare every ~10 s. No numbers. Scene kinds marked NEW still have to be drawn.
"""

TITLE = "TEKE TEKE"
TITLE_SUB = "THE GIRL ON THE TRACKS"
LOCATION = "HOKKAIDO · JAPAN"

SCENES = [
    {"kind": "teke_hook", "hook": True,               # NEW: empty night street, streetlight, something low in the dark behind
     "text": "If you hear a sound like teke, teke, teke behind you at night… *don't run.*"},
    {"kind": "winter_station", "location": True,      # NEW: snowy station at night, girl on the edge of the platform
     "text": "In Japan, they tell the story of a young woman who fell onto the railway tracks on a freezing *winter* night."},
    {"kind": "train_hit",                             # NEW: train headlights rushing in, white flash (implied, no gore)
     "text": "The train *never stopped.*"},
    {"kind": "frozen_crawl",                          # NEW: dark shape crawling through the snow, only seen from behind
     "text": "But she didn't die right away. In the freezing cold, she *crawled*… searching for what she had lost."},
    {"kind": "title_teke", "title": True,             # NEW: dark station tunnel, long hair, glowing eyes low to the ground
     "text": "Now her spirit haunts the stations. They call her *Teke Teke.*"},
    {"kind": "elbows",                                # NEW: close-up of elbows/hands slamming down on concrete
     "text": "That's the sound she makes. Her *elbows* dragging over the ground. Teke. Teke. Teke."},
    {"kind": "chase",                                 # NEW: runner on the platform, the shape closing in impossibly fast
     "text": "She moves faster than you can run. *Much faster.*"},
    {"kind": "question",                              # NEW: her face rising into the light, hair over her eyes
     "text": "Some say she asks you a question. *Where are my legs?*"},
    {"kind": "scythe",                                # NEW: her shadow growing over you on the wall, red flash
     "text": "If you can't answer… she makes you *just like her.*"},
    {"kind": "pov_platform",                          # NEW: POV empty platform, last train lights, dragging shape at the edge
     "text": "So if you're waiting for the last train, and you hear something dragging along the platform…"},
    {"kind": "teke_reveal", "hook": True,             # NEW: jump scare from below: her face right at your feet
     "text": "*don't look down.*"},
]
