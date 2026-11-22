"""Video 10 – Kuchisake-onna (the slit-mouthed woman), Japan.

Distinct from the reference channel's version: opens with the REAL 1979 panic.
Facts used:
- 1979: rumours of the masked woman spread across Japan (starting in Gifu); schools sent children
  home in groups, police increased patrols
- a woman in a long coat and a white (surgical) mask stops people after dark and asks "Am I beautiful?"
- "no" -> she won't let you go; "yes" -> she lowers the mask, her mouth stretches from ear to ear,
  she asks "Even now?" and makes you look like her
- running is useless, she appears in front of you again
- escape: answer that she looks "average" / so-so, which confuses her long enough to flee

Implicit wording (no 'slit', 'cut', 'blood', 'scissors' spoken). Numbers spelled out.
Scene kinds marked NEW still have to be drawn.
"""

TITLE = "KUCHISAKE-ONNA"
TITLE_SUB = "THE WOMAN IN THE WHITE MASK"
LOCATION = "GIFU · JAPAN"

SCENES = [
    {"kind": "ks_hook", "hook": True,            # NEW: children walking home in a group, masked figure under a streetlight
     "text": "In nineteen seventy-nine, children in Japan were too afraid to walk home alone. *Because of her.*"},
    {"kind": "ks_panic", "location": True,       # NEW: school gate, children in a line, police car lights
     "text": "Rumors spread from town to town. Schools sent kids home in groups, and *police* patrolled the streets."},
    {"kind": "ks_title", "title": True,          # NEW: woman in long coat + white mask at a corner, long black hair
     "text": "They were looking for a woman in a long coat and a white mask. *Kuchisake-onna.*"},
    {"kind": "ks_question",                      # NEW: she steps into the light, tilts her head
     "text": "She waits on street corners after dark and asks one question. *Am I beautiful?*"},
    {"kind": "ks_no",                            # NEW: her eyes narrow, shadow grows
     "text": "If you say no… *she won't let you leave.*"},
    {"kind": "ks_yes",                           # NEW: her hand slowly lowering the mask
     "text": "If you say yes… she slowly pulls down her mask."},
    {"kind": "ks_smile",                         # NEW: an impossibly wide smile (stylised, no gore)
     "text": "Her smile stretches from ear to ear. *Even now?* she asks."},
    {"kind": "ks_like_her",                      # NEW: red flash, your reflection wearing a mask
     "text": "Whatever you answer… she makes you look *just like her.*"},
    {"kind": "ks_corner",                        # NEW: you run around a corner - she is already waiting there
     "text": "Running doesn't help. She's always *waiting* at the next corner."},
    {"kind": "ks_escape",                        # NEW: she freezes, confused; you run past
     "text": "Some say the only way out is to tell her she looks *average.* While she's confused… you run."},
    {"kind": "ks_pov",                           # NEW: POV night street, masked woman far ahead under a lamp
     "text": "So if a woman in a mask ever stops you on your way home…"},
    {"kind": "ks_reveal", "hook": True,          # NEW: jump scare: mask drops, wide smile
     "text": "*think very carefully before you answer.*"},
]
