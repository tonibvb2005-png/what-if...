"""Video 4 – Baba Yaga, Russia (Slavic folklore).

Facts used (classic Russian fairy tales, esp. "Vasilisa the Beautiful", collected by Afanasyev):
- old witch of the deep forest, "Baba Yaga Bony Leg", iron teeth
- flies in a mortar, steers with a pestle, sweeps away her tracks with a broom
- her hut stands on chicken legs and turns; you must say:
  "Little hut, little hut, turn your back to the forest and your front to me"
- fence of human bones, skulls on the posts whose eyes glow at night
- Vasilisa is sent to fetch fire, gets impossible tasks; failing means being eaten
- she survives with the help of a little doll her dying mother gave her
- Baba Yaga smells humans ("I smell a Russian soul")

Rule: all numbers spelled out in English (TTS). Scene kinds marked NEW still have to be drawn.
"""

TITLE = "BABA YAGA"
TITLE_SUB = "THE BONE-LEGGED WITCH"
LOCATION = "DEEP FOREST · RUSSIA"

SCENES = [
    {"kind": "hut_glimpse", "hook": True,              # NEW: hut between trees, huge chicken legs, lit window
     "text": "If you ever find a hut in the forest standing on chicken legs… *don't knock.*"},
    {"kind": "taiga", "location": True,                # NEW: endless birch/pine forest, snow, moon
     "text": "Deep in the forests of *Russia*, every child knows the name of the old woman who lives there."},
    {"kind": "title_yaga", "title": True,              # NEW: witch silhouette, hunched, long nose, iron teeth glint
     "text": "They call her *Baba Yaga.* The witch with a bone leg and teeth of iron."},
    {"kind": "mortar_flight",                          # NEW: flying in a mortar across the moon, broom trail
     "text": "She doesn't walk. She flies through the night in a giant *mortar*, steering with a pestle… and sweeping away her tracks with a broom."},
    {"kind": "hut_turning",                            # NEW: hut on chicken legs slowly turning, legs stepping
     "text": "Her hut stands on *chicken legs.* It turns, and turns… so no one can find the door."},
    {"kind": "bone_fence",                             # NEW: fence of bones, skulls on posts
     "text": "Around it stands a fence made of *bones.* And on every post… a human skull."},
    {"kind": "skull_eyes",                             # NEW: close-up skulls, eyes light up one by one
     "text": "At night, the eyes of the skulls begin to *glow.*"},
    {"kind": "vasilisa_walk",                          # NEW: girl with a small doll walking through the dark forest
     "text": "In the oldest story, a girl named *Vasilisa* was sent to her hut to fetch fire."},
    {"kind": "spell",                                  # NEW: girl in front of the hut's back wall, whispering
     "text": "To get inside, she had to say the words. Little hut, little hut… *turn your back to the forest*, and your front to me."},
    {"kind": "door_opens",                             # NEW: hut turns toward her, door opens, warm/red light
     "text": "The hut groaned… and slowly turned toward her. The door *opened.*"},
    {"kind": "tasks",                                  # NEW: interior: oven, huge pile of grain, witch looming
     "text": "Baba Yaga gave her impossible tasks. If she failed even one… she would be *eaten.*"},
    {"kind": "doll_escape",                            # NEW: girl running away with a glowing skull lantern, doll
     "text": "Vasilisa survived, thanks to a little doll her dying mother gave her. *Most others never left.*"},
    {"kind": "pov_creak",                              # NEW: POV lost in the forest, giant legs stepping between trees
     "text": "So if you're ever lost in the woods, and you hear wood creaking… like something huge is turning toward you…"},
    {"kind": "yaga_reveal", "hook": True,              # NEW: jump scare: witch face, iron teeth, sniffing
     "text": "don't say a word. *She can smell you.*"},
]
