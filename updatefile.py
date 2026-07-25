#!/usr/bin/env python3
import os
import re

def walk_and_replace(directory="."):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".html"):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    content = re.sub(r'<title>.*?</title>', '<title>Home - Classroom</title>', content, flags=re.IGNORECASE)
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    
                    print(f"✓ {path}")
                except Exception as e:
                    print(f"✗ {path}: {e}")

if __name__ == "__main__":
    walk_and_replace()