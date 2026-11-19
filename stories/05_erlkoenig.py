"""Video 5 – Der Erlkönig (the Elf King), Germany.

Facts used: German/Danish folklore of the Erlkönig (ellerkonge), made famous by Goethe's ballad (1782):
- a father rides through night and wind with his son in his arms
- the boy sees the Erlking with crown and trailing robe; the father sees only fog
- the Erlking lures the boy with sweet promises (his daughters will dance with him)
- the father calls it the wind in the leaves / old grey willows, but rides faster
- "and if you're not willing, I'll use force" - the boy cries that he is being hurt
- the father reaches the farm: in his arms the child was dead

New rules: max ~160 words, short hard sentences, a scare every ~10 s, twist at the end.
All numbers spelled out in English. Scene kinds marked NEW still have to be drawn.
"""

TITLE = "DER ERLKÖNIG"
TITLE_SUB = "THE ELF KING"
LOCATION = "DARK WOODS · GERMANY"

SCENES = [
    {"kind": "erl_hook", "hook": True,                # NEW: misty forest, faint crowned figure between trunks
     "text": "If you hear a voice in the forest calling your child's name… *ride faster.*"},
    {"kind": "night_ride", "location": True,          # NEW: father on horseback galloping, boy in his arms, wind
     "text": "In German folklore, a father rides through the *night*, his little son in his arms."},
    {"kind": "title_erlking", "title": True,          # NEW: boy's terrified face, looking past the camera
     "text": "Then the boy whispers. Father… don't you see him? *The Elf King.*"},
    {"kind": "crowned_shape",                         # NEW: tall pale figure with crown + long cloak, then only fog
     "text": "A tall shape between the trees, with a *crown* and a long cloak. The father looks… only fog."},
    {"kind": "sweet_voice",                           # NEW: pale hand reaching from the mist, ghost daughters dancing
     "text": "Then the voice comes. Soft. Sweet. *Come with me, child.* My daughters will dance with you."},
    {"kind": "reaching",                              # NEW: long white fingers almost touching the boy's shoulder
     "text": "The boy screams. Father, he's *reaching* for me!"},
    {"kind": "wind_willows",                          # NEW: old willows like faces bending in the wind, horse galloping
     "text": "It's just the wind in the willows, the father says. *But he rides faster.*"},
    {"kind": "cold_voice",                            # NEW: Elf King's face turns cold, eyes glow, mist darkens
     "text": "The voice turns cold. If you won't come willingly… *I'll take you.*"},
    {"kind": "hurting",                               # NEW: the boy grabbed by mist hands, horse rearing
     "text": "The boy cries out one last time. *Father, he's hurting me!*"},
    {"kind": "farm_arrival",                          # NEW: farm courtyard at dawn, father holding the still boy
     "text": "The father reaches the farm. He looks down at the boy in his arms… *the child is dead.*"},
    {"kind": "pov_trees",                             # NEW: POV child's bedroom window, dark trees outside
     "text": "So if your child ever says someone is calling from the trees…"},
    {"kind": "erl_reveal", "hook": True,              # NEW: jump scare: the Elf King's face at the window
     "text": "*don't tell them it's the wind.*"},
]
