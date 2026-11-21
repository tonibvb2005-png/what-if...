"""Video 7 – La Ciguapa, Dominican Republic. FIRST TEST with AI-generated illustrations.

Facts used (Dominican folklore):
- a woman of the mountains/forests (Cordillera Central), seen at night, especially under a full moon
- extremely long glossy hair that covers her whole body; eyes that shine in the dark
- her feet face backwards, so her footprints point the wrong way and nobody can track her
- men who follow her into the mountains disappear
- she does not speak but makes soft whimpering / yelping sounds

Short format (~150 words), implicit (no graphic words), all numbers spelled out.
Every scene uses an AI illustration from assets/ai/ciguapa/<kind>.png (see scenes_ai.py).
"""

TITLE = "LA CIGUAPA"
TITLE_SUB = "THE WOMAN WITH BACKWARD FEET"
LOCATION = "CORDILLERA CENTRAL · DOMINICAN REPUBLIC"
AI_DIR = "assets/ai/ciguapa"

SCENES = [
    {"kind": "ai", "img": "hook", "hook": True, "crop": 0.9, "fy": 0.45, "sfx": ["jungle", "squelch"],
     "text": "If you find footprints in the forest leading away from you… *you're walking toward her.*"},
    {"kind": "ai", "img": "mountains", "location": True,
     "text": "High in the mountains of the *Dominican Republic*, people warn you never to follow footprints at night."},
    {"kind": "ai", "img": "title", "title": True,
     "text": "Because of her. *La Ciguapa.*"},
    {"kind": "ai", "img": "eyes",
     "text": "A woman with eyes that *shine* in the dark… and hair so long it covers her whole body."},
    {"kind": "ai", "img": "feet",
     "text": "But look at her feet. *They face backwards.*"},
    {"kind": "ai", "img": "hook", "crop": 0.5, "fy": 0.8, "cx": 0.5, "light": [0.5, 0.95], "sfx": ["squelch"],
     "text": "Every step she takes leaves a trail that points the *wrong way.*"},
    {"kind": "ai", "img": "mountains", "crop": 0.6, "fy": 0.72, "cx": 0.3,
     "text": "Hunters who tracked her walked deeper and deeper into the mountains… *and never came back.*"},
    {"kind": "ai", "img": "title", "crop": 0.65, "fy": 0.35,
     "text": "Some say she only appears under the *full moon.*"},
    {"kind": "ai", "img": "eyes", "cx": 0.15, "crop": 0.8, "eyes": [0.5, 0.66, 16], "eyes_at": 0.8, "sfx": ["whimper"],
     "text": "And she doesn't speak. She *whimpers*… like a lost puppy, so you'll come closer."},
    {"kind": "ai", "img": "hook", "crop": 0.75, "fy": 0.6, "cx": 0.45, "light": [0.5, 1.0], "push": 0.22, "sfx": ["squelch", "whimper_far"],
     "text": "So if you're ever lost in the mountains at night, and you see fresh footprints leading ahead of you…"},
    {"kind": "ai", "img": "eyes", "hook": True, "crop": 0.55, "fy": 0.4, "tint": [[90, 0, 0], 0.18], "push": 0.3,
     "text": "*the one who made them is right behind you.*"},
]
