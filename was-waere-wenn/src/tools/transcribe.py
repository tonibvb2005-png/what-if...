import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
import numpy as np
audio = np.fromfile(sys.argv[1], dtype=np.float32)
segs, info = m.transcribe(audio, language="de", word_timestamps=True, vad_filter=False)
out = []
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(len(out)); print(" ".join(x["w"] for x in out))
