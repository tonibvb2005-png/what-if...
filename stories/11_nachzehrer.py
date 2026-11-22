"""Video 11 – Der Nachzehrer, northern Germany (also Silesia / Kashubia).

Facts used (German folklore of revenants, esp. during epidemics):
- when several members of one family died in a row, people suspected the first one buried
- the Nachzehrer lies in his grave chewing his own burial shroud; with every bite his relatives weaken
- chewing / smacking sounds were said to come from the grave at night
- graves were opened; the body was said to have an eye open or the shroud in its mouth
- countermeasure: a stone or coin placed in the mouth so it could not chew
- archaeologists have found historical burials in Europe with stones/bricks placed in the mouth

Implicit wording, numbers spelled out. Scene kinds marked NEW still have to be drawn.
"""

TITLE = "DER NACHZEHRER"
TITLE_SUB = "THE ONE WHO FEEDS FROM THE GRAVE"
LOCATION = "NORTHERN GERMANY"

SCENES = [
    {"kind": "nz_hook", "hook": True,           # NEW: graveyard at night, fresh grave, faint sound waves from the earth
     "text": "If you hear chewing coming from inside a grave… *the whole village is in danger.*"},
    {"kind": "nz_village", "location": True,    # NEW: old half-timbered village, church, fog, sickly green tint
     "text": "In old German villages, when sickness came, people feared something worse than the *sickness.*"},
    {"kind": "nz_title", "title": True,         # NEW: lone grave with a wooden cross under the moon
     "text": "They called it *the Nachzehrer.* The one who doesn't rest in his grave."},
    {"kind": "nz_funerals",                     # NEW: funeral processions, crosses multiplying one by one
     "text": "It began with one funeral. Then another. And another. *Always the same family.*"},
    {"kind": "nz_sound",                        # NEW: villagers with lanterns listening at the graveyard wall
     "text": "At night, people heard a strange sound from the graveyard. *Chewing.*"},
    {"kind": "nz_shroud",                       # NEW: cross-section: dark coffin, a shroud slowly pulled inward
     "text": "They believed the man in the grave was chewing on his own burial shroud… and with every bite, *another relative grew weaker.*"},
    {"kind": "nz_dig",                          # NEW: villagers digging by lantern light, shovels, coffin lid
     "text": "So the villagers opened the grave. *One of his eyes was open.*"},
    {"kind": "nz_stone",                        # NEW: a hand placing a stone, close-up, candle
     "text": "To stop him, they placed a stone in his mouth… so he could *never* chew again."},
    {"kind": "nz_archaeology",                  # NEW: present day excavation, skull with a stone, torch light
     "text": "Archaeologists have found old graves like this all over Europe. *With stones in their mouths.*"},
    {"kind": "nz_pov",                          # NEW: POV walking past a graveyard wall at night
     "text": "So if you ever walk past an old graveyard at night, and you hear a soft, slow chewing…"},
    {"kind": "nz_reveal", "hook": True,         # NEW: jump scare: face rising from the earth, one eye open
     "text": "*don't stop to listen. He's still hungry.*"},
]
