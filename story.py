"""
Story / script for the video.

Every scene has the narration that is spoken WHILE that scene is on screen.
- Words wrapped in *asterisks* are highlighted red in the captions.
- A scene with "hook": True shows its LAST sentence as the big red hook text
  (like "DON'T MOVE." in the reference style) instead of the normal captions.

The full narration (for ElevenLabs) is just all scene texts joined together,
without the asterisks -> run `python make_video.py --print-script`.
"""

TITLE = "DER AUFHOCKER"
TITLE_SUB = "THE ONE WHO LEAPS ONTO YOUR BACK"
LOCATION = "EIFEL · GERMANY"

# Outro: your own channel branding (change freely)
CHANNEL_NAME = "BY LANTERN LIGHT"
CHANNEL_TAGLINE = "EVERY LIGHT CASTS A SHADOW."

SCENES = [
    {"kind": "hook_road", "hook": True,
     "text": "If something jumps on your back at night… *don't turn around.*"},
    {"kind": "forest_walk", "location": True,
     "text": "In the dark forests of *Germany*, there's a legend old farmers still whisper about."},
    {"kind": "title_creature", "title": True,
     "text": "They call it *the Aufhocker.* The one who leaps onto you."},
    {"kind": "crossroads",
     "text": "It waits at lonely *crossroads*, near old graveyards and wayside crosses."},
    {"kind": "face_closeup",
     "text": "When a traveler walks home alone after dark… it *follows* him. Silently."},
    {"kind": "jump",
     "text": "Then, without warning… it *jumps* onto his back."},
    {"kind": "claws",
     "text": "And it *never* lets go."},
    {"kind": "footsteps",
     "text": "With every step, it grows *heavier.* And heavier."},
    {"kind": "collapse",
     "text": "Until the man *collapses* under the weight, somewhere on the road."},
    {"kind": "village_bells",
     "text": "His only hope is to reach the first house of the village… or hear the *church bells* ring."},
    {"kind": "dawn",
     "text": "Because at the *first light* of morning, the Aufhocker lets go."},
    {"kind": "interior",
     "text": "But some travelers made it home… and never told anyone *what they carried.*"},
    {"kind": "pov_end",
     "text": "So if you're ever walking alone at night, and your back starts to feel *heavy*…"},
    {"kind": "eyes_reveal", "hook": True,
     "text": "keep walking. *Don't look back.*"},
]
