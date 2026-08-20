import json, re, subprocess
from pathlib import Path

MODEL_DIR = Path("suara_model")
OUT_DIR = Path("audio")
DATA_DIR = Path("data/categories")
MANIFEST_PATH = Path("data/manifest.json")

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

# Kumpulkan semua kata dari SEMUA kategori yang terdaftar di manifest.json
# (satu-satunya sumber kebenaran, sama seperti yang dipakai aplikasi di browser).
# Dedup berdasarkan slug nama Inggris, karena file audio disimpan per-slug —
# kalau kata yang sama muncul di lebih dari satu kategori, generate cukup sekali.
def kumpulkan_kosakata():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    daftar_id = manifest.get("aktif", [])

    kosakata = {}  # key: slug, value: item {en, id}
    for kategori_id in daftar_id:
        path_file = DATA_DIR / f"{kategori_id}.json"
        if not path_file.exists():
            print(f"PERINGATAN: file kategori tidak ditemukan, dilewati: {path_file}")
            continue
        data = json.loads(path_file.read_text(encoding="utf-8"))
        for item in data.get("kata", []):
            s = slug(item["en"])
            if s not in kosakata:
                kosakata[s] = item
            elif kosakata[s]["id"] != item["id"]:
                # Slug sama tapi terjemahan Indonesia beda antar kategori —
                # kata pertama yang ketemu yang dipakai, sisanya cuma diberi tahu.
                print(f"PERINGATAN: slug '{s}' punya terjemahan berbeda "
                      f"('{kosakata[s]['id']}' vs '{item['id']}'), pakai yang pertama ditemukan.")

    return list(kosakata.values())

def main():
    kosakata = kumpulkan_kosakata()
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

    print(f"Selesai. Total kata terdaftar: {len(kosakata)}. Dibuat baru: {dibuat}, dilewati (sudah ada): {dilewati}")

if __name__ == "__main__":
    main()
