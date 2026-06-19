import os
import shutil

def organize_files(directory="."):
    # Target directories
    dirs = {
        "Images": [".jpg", ".jpeg", ".gif"],
        "Documents": [".txt"],
        "Videos": [".mp4"]
    }
    
    # Ensure directories exist
    for folder in dirs.keys():
        if not os.path.exists(os.path.join(directory, folder)):
            os.makedirs(os.path.join(directory, folder))
            print(f"Created directory: {folder}")
            
    moved_count = 0
    
    # Scan files in the directory
    for item in os.listdir(directory):
        item_path = os.path.join(directory, item)
        
        # We only move files in the root (exclude folders)
        if os.path.isfile(item_path):
            name, ext = os.path.splitext(item.lower())
            
            # Check extension and move
            for folder, extensions in dirs.items():
                if ext in extensions:
                    dest_path = os.path.join(directory, folder, item)
                    try:
                        shutil.move(item_path, dest_path)
                        print(f"Moved: {item} -> {folder}/")
                        moved_count += 1
                    except Exception as e:
                        print(f"Error moving {item}: {e}")
                        
    print(f"Organization finished. Total files moved: {moved_count}")

if __name__ == "__main__":
    organize_files()
