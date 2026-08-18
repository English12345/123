import json, re, subprocess
from pathlib import Path

MODEL_DIR = Path("suara_model")
OUT_DIR = Path("audio")

def slug(teks):
    teks = teks.lower().strip()
    teks = re.sub(r'[^a-z0-9]+', '-', teks)
    return teks.strip('-')

def sintesis(teks, model_onnx, output_wav):
    proc = subprocess.run(
        ["piper", "--model", str(model_onnx), "--output_file", str(output_wav)],
        input=teks.encode("utf-8"),
        capture_output=True
    )
    if proc.returncode != 0:
        print("GAGAL sintesis:", teks, proc.stderr.decode())

def wav_ke_mp3(wav_path, mp3_path):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-qscale:a", "4", str(mp3_path)],
        capture_output=True
    )

def main():
    kosakata = json.loads(Path("kosakata.json").read_text(encoding="utf-8"))
    (OUT_DIR / "id").mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "en").mkdir(parents=True, exist_ok=True)

    dibuat = 0
    dilewati = 0
    for item in kosakata:
        nama_file = slug(item["en"])
        mp3_id = OUT_DIR / "id" / f"{nama_file}.mp3"
        mp3_en = OUT_DIR / "en" / f"{nama_file}.mp3"

        # KUNCI anti-bengkak: lewati kalau file sudah ada, jangan generate ulang
        if mp3_id.exists() and mp3_en.exists():
            dilewati += 1
            continue

        wav_id = OUT_DIR / "id" / f"{nama_file}.wav"
        sintesis(item["id"], MODEL_DIR / "id_ID-news_tts-medium.onnx", wav_id)
        wav_ke_mp3(wav_id, mp3_id)
        wav_id.unlink()

        wav_en = OUT_DIR / "en" / f"{nama_file}.wav"
        sintesis(item["en"], MODEL_DIR / "en_US-amy-medium.onnx", wav_en)
        wav_ke_mp3(wav_en, mp3_en)
        wav_en.unlink()

        dibuat += 1
        print(f"Dibuat: {item['id']} / {item['en']}")

    print(f"Selesai. Dibuat baru: {dibuat}, dilewati (sudah ada): {dilewati}")

if __name__ == "__main__":
    main()
