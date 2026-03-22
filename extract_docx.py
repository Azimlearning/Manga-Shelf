import zipfile
import re
import sys

def extract_text(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml').decode('utf-8')
            # remove XML tags
            text = re.sub('<[^<]+>', ' ', xml_content)
            # Remove multiple spaces
            text = re.sub(' +', ' ', text)
            print(text.strip())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_text(sys.argv[1])
