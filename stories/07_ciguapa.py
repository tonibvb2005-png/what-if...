"""Video 7 – La Ciguapa, Dominican Republic. FIRST TEST with AI-generated illustrations.

Facts used (Dominican folklore):
- a woman of the mountains/forests (Cordillera Central), seen at night, especially under a full moon
- extremely long glossy hair that covers her whole body; eyes that shine in the dark
- her feet face backwards, so her footprints point the wrong way and nobody can track her
- men who follow her into the mountains disappear
- she does not speak but makes soft whimpering / yelping sounds

Short format (~150 words), implicit (no graphic words), all numbers spelled out.
Animated scenes in scenes_ciguapa.py (the AI-image test version is kept in 07_ciguapa_ai_test.py).
"""

TITLE = "LA CIGUAPA"
TITLE_SUB = "THE WOMAN WITH BACKWARD FEET"
LOCATION = "CORDILLERA CENTRAL · DOMINICAN REPUBLIC"

SCENES = [
    {"kind": "cg_hook", "hook": True,
     "text": "If you find footprints in the forest leading away from you… *you're walking toward her.*"},
    {"kind": "cg_mountains", "location": True,
     "text": "High in the mountains of the *Dominican Republic*, people warn you never to follow footprints at night."},
    {"kind": "cg_title", "title": True,
     "text": "Because of her. *La Ciguapa.*"},
    {"kind": "cg_eyes",
     "text": "A woman with eyes that *shine* in the dark… and hair so long it covers her whole body."},
    {"kind": "cg_feet",
     "text": "But look at her feet. *They face backwards.*"},
    {"kind": "cg_tracks",
     "text": "Every step she takes leaves a trail that points the *wrong way.*"},
    {"kind": "cg_hunters",
     "text": "Hunters who tracked her walked deeper and deeper into the mountains… *and never came back.*"},
    {"kind": "cg_moon",
     "text": "Some say she only appears under the *full moon.*"},
    {"kind": "cg_whimper",
     "text": "And she doesn't speak. She *whimpers*… like a lost puppy, so you'll come closer."},
    {"kind": "cg_pov",
     "text": "So if you're ever lost in the mountains at night, and you see fresh footprints leading ahead of you…"},
    {"kind": "cg_reveal", "hook": True,
     "text": "*the one who made them is right behind you.*"},
]
