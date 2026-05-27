# MarkItDown Skill

Convert files and URLs to Markdown using Microsoft's MarkItDown tool.

## Trigger

Use this skill when the user asks to:
- Convert a file to Markdown (PDF, Word, Excel, PowerPoint, HTML, CSV, JSON, XML, images, audio, ZIP)
- Extract text or content from a document
- Transform a URL or web page to Markdown

## Actions

### Convert a file
```bash
markitdown /path/to/file.pdf
markitdown /path/to/file.docx
markitdown /path/to/file.xlsx
markitdown /path/to/file.pptx
```

### Convert a URL
```bash
markitdown https://example.com
```

### Save output to file
```bash
markitdown /path/to/file.pdf -o output.md
```

### Convert via Python
```python
from markitdown import MarkItDown
md = MarkItDown()
result = md.convert("file.pdf")
print(result.text_content)
```

## Supported Formats

| Format | Extensions |
|--------|-----------|
| PDF | .pdf |
| Word | .docx, .doc |
| Excel | .xlsx, .xls |
| PowerPoint | .pptx, .ppt |
| HTML | .html, .htm |
| CSV | .csv |
| JSON | .json |
| XML | .xml |
| Images | .jpg, .png, .gif, .bmp, .tiff |
| Audio | .mp3, .wav (transcription) |
| ZIP | .zip (extracts and converts contents) |
| Web | URLs |

## Workflow

1. Run `markitdown <file_or_url>` via Bash
2. Capture and display the Markdown output
3. Optionally save to a `.md` file with `-o output.md`
