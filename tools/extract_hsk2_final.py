"""Extract only the original question illustrations, in visual reading order."""
import os
from pathlib import Path
import pdfplumber
from PIL import Image

source = Path('/Users/pinhthanh/Downloads/Đề HSK 2 - cuối kỳ .pdf')
target = Path(__file__).resolve().parents[1] / 'public/assets/hsk2-final'
render_dir = Path(os.environ.get('HSK2_FINAL_RENDER_DIR', '/private/tmp/hsk2-final-pages'))
target.mkdir(parents=True, exist_ok=True)
with pdfplumber.open(source) as pdf:
    for page_number in (2, 3, 4, 5, 9):
        page = pdf.pages[page_number - 1]
        raster = Image.open(render_dir / f'page-{page_number:02}.png')
        # Two-column banks have slightly different image tops: sort into visual rows.
        pictures = sorted(page.images, key=lambda x: x['top'])
        if page_number in (4, 5, 9):
            pictures = [p for start in range(0, len(pictures), 2)
                        for p in sorted(pictures[start:start + 2], key=lambda x: x['x0'])]
        for index, picture in enumerate(pictures, 1):
            box = tuple(round(value * scale) for value, scale in zip(
                (picture['x0'], picture['top'], picture['x1'], picture['bottom']),
                (raster.width / page.width, raster.height / page.height) * 2))
            raster.crop(box).save(target / f'p{page_number}-{index}.png')
        print(page_number, len(pictures))
