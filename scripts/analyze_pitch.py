import sys, subprocess, numpy as np

def analyze_audio(wav_path):
    # Convert or load 16kHz mono wav
    p = subprocess.run([
        'ffmpeg', '-y', '-i', wav_path, '-ar', '16000', '-ac', '1', '-f', 's16le', 'pipe:1'
    ], capture_output=True)
    audio = np.frombuffer(p.stdout, dtype=np.int16).astype(np.float32)
    
    sr = 16000
    frame_len = int(0.04 * sr) # 40ms
    hop_len = int(0.01 * sr)   # 10ms
    
    f0_list = []
    times = []
    
    for i in range(0, len(audio) - frame_len, hop_len):
        frame = audio[i : i + frame_len]
        energy = np.sum(frame ** 2) / frame_len
        if energy < 5e5: # silence threshold
            continue
        
        # Autocorrelation
        corr = np.correlate(frame, frame, mode='full')
        corr = corr[len(corr)//2:]
        
        min_lag = int(sr / 450) # max 450Hz
        max_lag = int(sr / 90)  # min 90Hz
        
        if max_lag >= len(corr):
            continue
            
        peak_lag = min_lag + np.argmax(corr[min_lag:max_lag])
        if corr[peak_lag] > 0.4 * corr[0]:
            f0 = sr / peak_lag
            f0_list.append(f0)
            times.append(i / sr)
            
    if not f0_list:
        return []
    
    # Chunk into 3-4 parts to represent moras
    n = len(f0_list)
    part_size = max(1, n // 3)
    parts = []
    for k in range(0, n, part_size):
        sub = f0_list[k : k + part_size]
        if sub:
            parts.append(float(np.median(sub)))
    return parts

if __name__ == '__main__':
    print(analyze_audio(sys.argv[1]))
