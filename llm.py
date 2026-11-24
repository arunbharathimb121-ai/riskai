import os
from pathlib import Path
from huggingface_hub import hf_hub_download


def getmodelpath() -> str:
    repo = "openbmb/MiniCPM5-2B-GGUF"
    filename = "MiniCPM5-2B-Q4_K_M.gguf"

    folder = Path(__file__).parent / "models"
    folder.mkdir(parents=True, exist_ok=True)

    path = folder / filename

    if path.exists() and path.stat().st_size < 1_400_000_000:
        print("[WARN] Incomplete model detected. Removing...")
        path.unlink()

    if path.exists():
        print(f"[INFO] Using local model: {path}")
        return str(path)

    print(f"[INFO] Downloading {filename} from {repo}...")

    downloaded = hf_hub_download(
        repo_id=repo,
        filename=filename,
        local_dir=str(folder),
        local_dir_use_symlinks=False
    )

    print(f"[INFO] Model downloaded: {downloaded}")

    return str(downloaded)


if __name__ == "__main__":
    p = getmodelpath()
    print(f"Path: {p}")
