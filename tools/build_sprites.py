from pathlib import Path
import json,random
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
c=json.loads((root/'scripts/catalog.js').read_text().split('module.exports = ',1)[1].rsplit(';',1)[0]);out=root/'sprites';out.mkdir(exist_ok=True)
# Extend the mod's existing small geometric sprite system; all assets authored in code.
for n,d in enumerate(c['items']):
 if d['id'] in ['circuit','glassware','machine-parts','metal-parts']:continue
 im=Image.new('RGBA',(32,32));p=ImageDraw.Draw(im);color='#'+d['color'];edge='#394752'
 if d['kind']=='raw':
  p.polygon([(4,21),(7,9),(17,3),(27,10),(29,23),(19,29),(8,27)],fill=color,outline=edge,width=2);p.line([(9,11),(17,7),(22,10)],fill='#e3e4df',width=2)
 elif d['kind']=='final':
  p.rounded_rectangle((3,5,29,27),radius=4,fill=color,outline=edge,width=2);p.rectangle((7,9,25,18),fill='#263940');p.line((8,23,24,23),fill='#e1d69c',width=2)
 else:
  p.rectangle((5,5,27,27),fill=color,outline=edge,width=2);p.rectangle((10,10,22,22),fill='#657c8c');p.line((12,12,20,12),fill='#e3e8ee',width=2)
 # Deterministic corner markers distinguish small icons without relying on fonts.
 for bit in range(5):
  if n&(1<<bit):p.rectangle((3+bit*5,28,6+bit*5,30),fill='#e5bc61')
 im.save(out/(d['id']+'.png'))
 if d['kind']=='raw':
  for v in range(1,4):
   im=Image.new('RGBA',(32,32));p=ImageDraw.Draw(im);rng=random.Random(n*11+v)
   for j in range(9):
    x=rng.randrange(3,26);y=rng.randrange(3,26);p.polygon([(x,y),(x+4,y-2),(x+6,y+3),(x+1,y+5)],fill=color,outline=edge)
   im.save(out/('ore-'+d['id']+str(v)+'.png'))
for n,f in enumerate(c['factories']+[{'id':'market'},{'id':'headquarters'},{'id':'import-terminal'}]):
 im=Image.new('RGBA',(64,64));p=ImageDraw.Draw(im);accent=['#cda079','#b8e0ea','#93d99e','#c6a5ee'][n%4]
 p.rectangle((1,1,62,62),fill='#39424b',outline='#252b30',width=3);p.rectangle((7,7,56,56),fill='#677681',outline='#a0a9ad',width=2)
 p.rectangle((14,14,44,44),fill='#303b43',outline=accent,width=3);p.rectangle((20,20,38,38),fill=accent)
 for x,y in [(3,3),(54,3),(3,54),(54,54)]:p.rectangle((x,y,x+6,y+6),fill='#c6c6bc')
 p.rectangle((47,15,54,44),fill='#273239');p.line((50,18,50,39),fill=accent,width=2)
 im.save(out/(f['id']+'.png'))
print('sprites',len(list(out.glob('*.png'))))
