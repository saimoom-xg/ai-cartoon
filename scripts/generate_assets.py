import os
import math
from PIL import Image, ImageDraw

PUBLIC_ASSETS = "/home/saimoom/Sites/ai-cartoon/public/assets"
REPO_ASSETS = "/home/saimoom/Sites/ai-cartoon/assets"

for base in [PUBLIC_ASSETS, REPO_ASSETS]:
    os.makedirs(f"{base}/characters", exist_ok=True)
    os.makedirs(f"{base}/animals", exist_ok=True)
    os.makedirs(f"{base}/vehicles", exist_ok=True)
    os.makedirs(f"{base}/objects", exist_ok=True)
    os.makedirs(f"{base}/backgrounds", exist_ok=True)
    os.makedirs(f"{base}/buildings", exist_ok=True)

def save_asset(img, rel_path):
    p1 = os.path.join(PUBLIC_ASSETS, rel_path)
    p2 = os.path.join(REPO_ASSETS, rel_path)
    img.save(p1, "PNG")
    img.save(p2, "PNG")
    print(f"Saved {rel_path} ({img.size})")

# 1. BOY
def create_boy():
    w, h = 400, 500
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([120, 460, 280, 485], fill=(0, 0, 0, 40))
    
    # Legs & Shoes
    # Left leg
    d.rectangle([150, 320, 185, 440], fill=(59, 130, 246))
    # Right leg
    d.rectangle([215, 320, 250, 440], fill=(59, 130, 246))
    # Shoes
    d.rounded_rectangle([135, 430, 190, 465], radius=12, fill=(239, 68, 68), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([210, 430, 265, 465], radius=12, fill=(239, 68, 68), outline=(30, 41, 59), width=3)
    d.ellipse([140, 450, 185, 465], fill=(255, 255, 255))
    d.ellipse([215, 450, 260, 465], fill=(255, 255, 255))
    
    # Torso (T-Shirt)
    d.rounded_rectangle([140, 200, 260, 330], radius=20, fill=(16, 185, 129), outline=(30, 41, 59), width=4)
    # Stripe or graphic
    d.polygon([(185, 240), (215, 240), (195, 270), (220, 270), (180, 310), (195, 275), (180, 275)], fill=(250, 204, 21))
    
    # Arms
    # Left arm
    d.rounded_rectangle([105, 210, 145, 320], radius=16, fill=(16, 185, 129), outline=(30, 41, 59), width=4)
    d.ellipse([105, 305, 145, 345], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    # Right arm
    d.rounded_rectangle([255, 210, 295, 320], radius=16, fill=(16, 185, 129), outline=(30, 41, 59), width=4)
    d.ellipse([255, 305, 295, 345], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    
    # Neck
    d.rectangle([185, 180, 215, 210], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    
    # Head & Face
    d.ellipse([135, 70, 265, 200], fill=(254, 215, 170), outline=(30, 41, 59), width=4)
    # Cheeks
    d.ellipse([148, 145, 172, 165], fill=(251, 146, 60, 100))
    d.ellipse([228, 145, 252, 165], fill=(251, 146, 60, 100))
    # Eyes
    d.ellipse([160, 115, 180, 145], fill=(15, 23, 42))
    d.ellipse([220, 115, 240, 145], fill=(15, 23, 42))
    # Eye highlights
    d.ellipse([163, 118, 172, 128], fill=(255, 255, 255))
    d.ellipse([223, 118, 232, 128], fill=(255, 255, 255))
    # Smile
    d.arc([175, 140, 225, 175], start=0, end=180, fill=(30, 41, 59), width=4)
    # Nose
    d.ellipse([195, 135, 205, 145], fill=(249, 115, 22))
    # Ears
    d.ellipse([125, 120, 145, 150], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    d.ellipse([255, 120, 275, 150], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    # Hair
    d.chord([125, 45, 275, 140], start=180, end=360, fill=(120, 53, 15), outline=(30, 41, 59), width=4)
    d.polygon([(140, 80), (160, 110), (180, 80), (200, 110), (220, 80), (240, 110), (260, 80)], fill=(120, 53, 15))
    
    save_asset(img, "characters/boy.png")

# 2. GIRL
def create_girl():
    w, h = 400, 500
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([120, 460, 280, 485], fill=(0, 0, 0, 40))
    
    # Legs & Shoes
    d.rectangle([160, 340, 185, 440], fill=(254, 215, 170), outline=(30, 41, 59), width=2)
    d.rectangle([215, 340, 240, 440], fill=(254, 215, 170), outline=(30, 41, 59), width=2)
    d.rounded_rectangle([145, 430, 195, 465], radius=12, fill=(236, 72, 153), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([205, 430, 255, 465], radius=12, fill=(236, 72, 153), outline=(30, 41, 59), width=3)
    
    # Dress (A-line)
    d.polygon([(170, 200), (230, 200), (275, 360), (125, 360)], fill=(244, 63, 94), outline=(30, 41, 59))
    # Polka dots on dress
    for px, py in [(170, 250), (230, 260), (200, 290), (150, 320), (250, 325), (200, 340)]:
        d.ellipse([px-8, py-8, px+8, py+8], fill=(255, 255, 255))
        
    # Arms
    d.rounded_rectangle([100, 205, 140, 310], radius=14, fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([260, 205, 300, 310], radius=14, fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    
    # Neck
    d.rectangle([185, 175, 215, 205], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    
    # Ponytails (Behind Head)
    d.ellipse([70, 70, 150, 150], fill=(245, 158, 11), outline=(30, 41, 59), width=4)
    d.ellipse([250, 70, 330, 150], fill=(245, 158, 11), outline=(30, 41, 59), width=4)
    # Hair ties
    d.ellipse([125, 95, 145, 115], fill=(236, 72, 153))
    d.ellipse([255, 95, 275, 115], fill=(236, 72, 153))
    
    # Head & Face
    d.ellipse([135, 65, 265, 195], fill=(254, 215, 170), outline=(30, 41, 59), width=4)
    # Cheeks
    d.ellipse([145, 140, 175, 160], fill=(244, 114, 182, 140))
    d.ellipse([225, 140, 255, 160], fill=(244, 114, 182, 140))
    # Eyes
    d.ellipse([160, 110, 180, 138], fill=(15, 23, 42))
    d.ellipse([220, 110, 240, 138], fill=(15, 23, 42))
    # Sparkle
    d.ellipse([163, 113, 171, 122], fill=(255, 255, 255))
    d.ellipse([223, 113, 231, 122], fill=(255, 255, 255))
    # Smile
    d.arc([175, 135, 225, 170], start=0, end=180, fill=(30, 41, 59), width=4)
    # Hair Bangs
    d.chord([125, 45, 275, 125], start=180, end=360, fill=(245, 158, 11), outline=(30, 41, 59), width=4)
    d.polygon([(135, 80), (165, 105), (195, 80), (225, 105), (265, 80)], fill=(245, 158, 11))
    
    save_asset(img, "characters/girl.png")

# 3. FRIEND
def create_friend():
    w, h = 400, 500
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([120, 460, 280, 485], fill=(0, 0, 0, 40))
    
    # Legs & Shoes
    d.rectangle([150, 320, 185, 440], fill=(71, 85, 105))
    d.rectangle([215, 320, 250, 440], fill=(71, 85, 105))
    d.rounded_rectangle([135, 430, 190, 465], radius=10, fill=(245, 158, 11), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([210, 430, 265, 465], radius=10, fill=(245, 158, 11), outline=(30, 41, 59), width=3)
    
    # Torso (Hoodie)
    d.rounded_rectangle([135, 195, 265, 330], radius=20, fill=(139, 92, 246), outline=(30, 41, 59), width=4)
    # Hoodie Pocket
    d.rounded_rectangle([160, 270, 240, 315], radius=8, fill=(124, 58, 237), outline=(30, 41, 59), width=2)
    
    # Arms
    d.rounded_rectangle([100, 205, 140, 310], radius=16, fill=(139, 92, 246), outline=(30, 41, 59), width=3)
    d.ellipse([98, 295, 138, 335], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    # Right arm waving thumbs up
    d.rounded_rectangle([260, 170, 300, 280], radius=16, fill=(139, 92, 246), outline=(30, 41, 59), width=3)
    d.ellipse([262, 145, 305, 185], fill=(254, 215, 170), outline=(30, 41, 59), width=3)
    
    # Head & Cap (Backwards cap)
    d.ellipse([135, 75, 265, 200], fill=(254, 215, 170), outline=(30, 41, 59), width=4)
    # Cap
    d.chord([125, 40, 275, 135], start=180, end=360, fill=(239, 68, 68), outline=(30, 41, 59), width=4)
    # Cap visor pointing back
    d.rounded_rectangle([100, 65, 150, 85], radius=8, fill=(220, 38, 38), outline=(30, 41, 59), width=3)
    
    # Eyes & Smile
    d.ellipse([162, 120, 180, 142], fill=(15, 23, 42))
    d.ellipse([220, 120, 238, 142], fill=(15, 23, 42))
    d.ellipse([165, 123, 172, 130], fill=(255, 255, 255))
    d.ellipse([223, 123, 230, 130], fill=(255, 255, 255))
    d.arc([175, 140, 225, 175], start=0, end=180, fill=(30, 41, 59), width=4)
    
    save_asset(img, "characters/friend.png")

# 4. OLD MAN
def create_old_man():
    w, h = 400, 500
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([120, 460, 280, 485], fill=(0, 0, 0, 40))
    
    # Legs & Cane
    d.rectangle([150, 320, 185, 440], fill=(100, 116, 139))
    d.rectangle([215, 320, 250, 440], fill=(100, 116, 139))
    d.rounded_rectangle([135, 430, 190, 465], radius=8, fill=(69, 26, 3), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([210, 430, 265, 465], radius=8, fill=(69, 26, 3), outline=(30, 41, 59), width=3)
    
    # Walking cane
    d.rounded_rectangle([275, 260, 288, 465], radius=6, fill=(180, 83, 9), outline=(30, 41, 59), width=2)
    d.arc([260, 235, 290, 275], start=180, end=360, fill=(180, 83, 9), width=8)
    
    # Torso (Vest & Sweater)
    d.rounded_rectangle([135, 195, 265, 335], radius=18, fill=(202, 138, 4), outline=(30, 41, 59), width=4)
    # Buttons
    for by in [230, 260, 290]:
        d.ellipse([196, by, 204, by+8], fill=(69, 26, 3))
        
    # Arms
    d.rounded_rectangle([105, 205, 142, 315], radius=14, fill=(161, 98, 7), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([258, 205, 295, 285], radius=14, fill=(161, 98, 7), outline=(30, 41, 59), width=3)
    
    # Head & Balding Hair
    # White side hair
    d.ellipse([115, 95, 155, 155], fill=(226, 232, 240), outline=(30, 41, 59), width=2)
    d.ellipse([245, 95, 285, 155], fill=(226, 232, 240), outline=(30, 41, 59), width=2)
    # Face
    d.ellipse([135, 75, 265, 205], fill=(254, 215, 170), outline=(30, 41, 59), width=4)
    
    # Glasses
    d.ellipse([155, 110, 192, 145], fill=None, outline=(15, 23, 42), width=3)
    d.ellipse([208, 110, 245, 145], fill=None, outline=(15, 23, 42), width=3)
    d.line([192, 127, 208, 127], fill=(15, 23, 42), width=3)
    # Eyes behind glasses
    d.ellipse([168, 122, 180, 134], fill=(15, 23, 42))
    d.ellipse([220, 122, 232, 134], fill=(15, 23, 42))
    
    # Big White Mustache
    d.ellipse([160, 145, 205, 172], fill=(241, 245, 249), outline=(30, 41, 59), width=2)
    d.ellipse([195, 145, 240, 172], fill=(241, 245, 249), outline=(30, 41, 59), width=2)
    # Smile below mustache
    d.arc([185, 160, 215, 185], start=0, end=180, fill=(30, 41, 59), width=3)
    
    save_asset(img, "characters/old-man.png")

# 5. DOG
def create_dog():
    w, h = 400, 360
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([60, 320, 340, 350], fill=(0, 0, 0, 40))
    
    # Tail wagging
    d.arc([40, 110, 120, 220], start=90, end=270, fill=(217, 119, 6), width=18)
    
    # Back Legs
    d.rounded_rectangle([100, 230, 140, 335], radius=16, fill=(180, 83, 9), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([150, 230, 185, 335], radius=16, fill=(217, 119, 6), outline=(30, 41, 59), width=3)
    
    # Body
    d.rounded_rectangle([90, 160, 270, 280], radius=40, fill=(245, 158, 11), outline=(30, 41, 59), width=4)
    # Puppy spot
    d.ellipse([130, 180, 180, 230], fill=(217, 119, 6))
    
    # Front Legs
    d.rounded_rectangle([220, 220, 255, 335], radius=16, fill=(245, 158, 11), outline=(30, 41, 59), width=3)
    d.rounded_rectangle([250, 220, 285, 335], radius=16, fill=(217, 119, 6), outline=(30, 41, 59), width=3)
    
    # Paws
    for px in [100, 145, 218, 248]:
        d.rounded_rectangle([px, 315, px+38, 338], radius=8, fill=(254, 243, 199), outline=(30, 41, 59), width=2)
        
    # Head & Ears
    # Floppy ear back
    d.ellipse([230, 70, 275, 160], fill=(180, 83, 9), outline=(30, 41, 59), width=3)
    # Head
    d.ellipse([235, 70, 350, 185], fill=(245, 158, 11), outline=(30, 41, 59), width=4)
    # Floppy ear front
    d.ellipse([295, 80, 345, 175], fill=(217, 119, 6), outline=(30, 41, 59), width=3)
    
    # Snout
    d.ellipse([275, 120, 360, 190], fill=(254, 243, 199), outline=(30, 41, 59), width=3)
    # Nose
    d.ellipse([325, 128, 350, 150], fill=(15, 23, 42))
    # Mouth & Tongue
    d.arc([295, 145, 335, 175], start=0, end=180, fill=(30, 41, 59), width=3)
    d.chord([300, 160, 320, 185], start=0, end=180, fill=(244, 63, 94))
    
    # Eye
    d.ellipse([275, 100, 298, 125], fill=(15, 23, 42))
    d.ellipse([280, 104, 288, 112], fill=(255, 255, 255))
    
    # Red Collar
    d.arc([235, 150, 295, 210], start=30, end=150, fill=(239, 68, 68), width=10)
    d.ellipse([260, 192, 275, 207], fill=(250, 204, 21))
    
    save_asset(img, "animals/dog.png")

# 6. CAT
def create_cat():
    w, h = 360, 360
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([60, 320, 300, 345], fill=(0, 0, 0, 40))
    
    # Curled tail
    d.arc([30, 120, 130, 280], start=70, end=270, fill=(249, 115, 22), width=16)
    
    # Body
    d.ellipse([100, 170, 250, 320], fill=(251, 146, 60), outline=(30, 41, 59), width=4)
    # Paws
    d.rounded_rectangle([130, 295, 170, 330], radius=10, fill=(255, 237, 213), outline=(30, 41, 59), width=2)
    d.rounded_rectangle([180, 295, 220, 330], radius=10, fill=(255, 237, 213), outline=(30, 41, 59), width=2)
    
    # Chest patch
    d.ellipse([140, 210, 210, 290], fill=(255, 237, 213))
    
    # Pointy Ears
    d.polygon([(120, 110), (145, 45), (180, 100)], fill=(234, 88, 12), outline=(30, 41, 59))
    d.polygon([(130, 95), (145, 60), (168, 95)], fill=(254, 205, 211))
    d.polygon([(200, 100), (235, 45), (260, 110)], fill=(234, 88, 12), outline=(30, 41, 59))
    d.polygon([(212, 95), (235, 60), (250, 95)], fill=(254, 205, 211))
    
    # Head
    d.ellipse([115, 80, 265, 210], fill=(251, 146, 60), outline=(30, 41, 59), width=4)
    
    # Eyes (Green cartoon cat eyes)
    d.ellipse([140, 120, 172, 155], fill=(34, 197, 94), outline=(30, 41, 59), width=2)
    d.ellipse([208, 120, 240, 155], fill=(34, 197, 94), outline=(30, 41, 59), width=2)
    # Slit pupils
    d.ellipse([152, 122, 160, 153], fill=(15, 23, 42))
    d.ellipse([220, 122, 228, 153], fill=(15, 23, 42))
    
    # Nose & Whiskers
    d.polygon([(185, 155), (195, 155), (190, 165)], fill=(244, 114, 182))
    d.arc([175, 160, 190, 175], start=0, end=180, fill=(30, 41, 59), width=2)
    d.arc([190, 160, 205, 175], start=0, end=180, fill=(30, 41, 59), width=2)
    # Whiskers
    d.line([110, 155, 160, 162], fill=(30, 41, 59), width=2)
    d.line([115, 170, 162, 172], fill=(30, 41, 59), width=2)
    d.line([220, 162, 270, 155], fill=(30, 41, 59), width=2)
    d.line([218, 172, 265, 170], fill=(30, 41, 59), width=2)
    
    save_asset(img, "animals/cat.png")

# 7. RED CAR
def create_red_car():
    w, h = 600, 360
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([40, 310, 560, 345], fill=(0, 0, 0, 45))
    
    # Wheels (Back and Front)
    for cx in [140, 460]:
        d.ellipse([cx-55, 230, cx+55, 335], fill=(30, 41, 59), outline=(15, 23, 42), width=4)
        d.ellipse([cx-32, 252, cx+32, 314], fill=(203, 213, 225))
        d.ellipse([cx-12, 272, cx+12, 295], fill=(239, 68, 68))
        
    # Car Body (Lower)
    d.rounded_rectangle([60, 170, 540, 290], radius=35, fill=(239, 68, 68), outline=(15, 23, 42), width=5)
    
    # Car Roof / Cabin (Upper)
    d.polygon([(160, 170), (220, 80), (410, 80), (470, 170)], fill=(220, 38, 38), outline=(15, 23, 42))
    
    # Windows
    # Front Windshield
    d.polygon([(400, 95), (455, 165), (325, 165), (325, 95)], fill=(186, 230, 253), outline=(15, 23, 42), width=3)
    # Rear Window
    d.polygon([(230, 95), (315, 95), (315, 165), (175, 165)], fill=(186, 230, 253), outline=(15, 23, 42), width=3)
    # Glass Glare
    d.line([(345, 105), (380, 155)], fill=(255, 255, 255), width=5)
    d.line([(255, 105), (290, 155)], fill=(255, 255, 255), width=5)
    
    # Headlights & Taillights
    # Yellow headlight
    d.rounded_rectangle([515, 185, 545, 225], radius=10, fill=(250, 204, 21), outline=(15, 23, 42), width=3)
    # Taillight
    d.rounded_rectangle([55, 185, 75, 225], radius=6, fill=(185, 28, 28), outline=(15, 23, 42), width=2)
    # Bumper
    d.rounded_rectangle([50, 260, 100, 285], radius=8, fill=(226, 232, 240), outline=(15, 23, 42), width=3)
    d.rounded_rectangle([500, 260, 550, 285], radius=8, fill=(226, 232, 240), outline=(15, 23, 42), width=3)
    # Door handle
    d.rounded_rectangle([290, 195, 330, 205], radius=4, fill=(15, 23, 42))
    
    save_asset(img, "vehicles/red-car.png")

# 8. FOOTBALL
def create_football():
    w, h = 300, 300
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([50, 255, 250, 285], fill=(0, 0, 0, 45))
    
    # Ball Base
    d.ellipse([30, 20, 270, 260], fill=(248, 250, 252), outline=(15, 23, 42), width=6)
    
    # Center Pentagon
    cx, cy, r = 150, 140, 42
    points = [
        (cx + r * math.sin(math.radians(i * 72)), cy - r * math.cos(math.radians(i * 72)))
        for i in range(5)
    ]
    d.polygon(points, fill=(15, 23, 42))
    
    # Seams from pentagon vertices outwards
    outer_angles = [0, 72, 144, 216, 288]
    for idx, (px, py) in enumerate(points):
        ang = outer_angles[idx]
        ox = cx + 90 * math.sin(math.radians(ang))
        oy = cy - 90 * math.cos(math.radians(ang))
        d.line([(px, py), (ox, oy)], fill=(15, 23, 42), width=5)
        # Outer small patches
        d.ellipse([ox-20, oy-20, ox+20, oy+20], fill=(15, 23, 42))
        
    # Shine highlight
    d.arc([55, 35, 120, 100], start=160, end=290, fill=(255, 255, 255), width=8)
    
    save_asset(img, "objects/football.png")

# 9. TREE
def create_tree():
    w, h = 420, 540
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    
    # Shadow
    d.ellipse([100, 490, 320, 525], fill=(0, 0, 0, 40))
    
    # Trunk
    d.polygon([(170, 260), (250, 260), (270, 505), (150, 505)], fill=(120, 53, 15), outline=(15, 23, 42), width=5)
    # Bark details
    d.line([(190, 320), (195, 460)], fill=(69, 26, 3), width=4)
    d.line([(225, 300), (235, 450)], fill=(69, 26, 3), width=4)
    
    # Foliage Puffs
    foliage = [
        (90, 180, 230, 320, (34, 197, 94)),
        (190, 180, 330, 320, (34, 197, 94)),
        (70, 110, 220, 250, (22, 163, 74)),
        (200, 110, 350, 250, (22, 163, 74)),
        (130, 40, 290, 200, (74, 222, 128)),
    ]
    for x1, y1, x2, y2, col in foliage:
        d.ellipse([x1, y1, x2, y2], fill=col, outline=(15, 23, 42), width=5)
        # Highlights
        d.arc([x1+15, y1+15, x1+65, y1+65], start=180, end=300, fill=(255, 255, 255, 160), width=5)
        
    save_asset(img, "objects/tree.png")

# 10. PARK BACKGROUND
def create_park():
    w, h = 1000, 600
    img = Image.new("RGB", (w, h), (186, 230, 253))  # Sky
    d = ImageDraw.Draw(img)
    
    # Sun
    d.ellipse([820, 50, 930, 160], fill=(253, 224, 71), outline=(250, 204, 21), width=4)
    
    # Clouds
    def draw_cloud(cx, cy, scale=1.0):
        for ox, oy, rad in [(-40, 0, 35), (0, -20, 45), (40, 0, 35), (0, 10, 35)]:
            d.ellipse([cx + ox*scale - rad*scale, cy + oy*scale - rad*scale,
                       cx + ox*scale + rad*scale, cy + oy*scale + rad*scale], fill=(255, 255, 255))
    draw_cloud(200, 120, 1.1)
    draw_cloud(550, 100, 0.9)
    draw_cloud(780, 150, 0.7)
    
    # Distant hills
    d.chord([-100, 280, 600, 650], start=180, end=360, fill=(134, 239, 172))
    d.chord([400, 260, 1150, 650], start=180, end=360, fill=(187, 247, 208))
    
    # Distant Trees
    for tx in [120, 200, 480, 560, 640]:
        d.ellipse([tx-25, 300, tx+25, 370], fill=(34, 197, 94))
        
    # Main park lawn
    d.chord([-200, 350, 1200, 900], start=180, end=360, fill=(34, 197, 94))
    
    # Winding park path
    d.polygon([(100, 600), (320, 460), (420, 460), (480, 600)], fill=(254, 240, 138), outline=(234, 179, 8), width=3)
    
    # Wooden park bench on right
    d.rounded_rectangle([720, 460, 860, 480], radius=5, fill=(180, 83, 9), outline=(15, 23, 42), width=3)
    d.line([(740, 480), (735, 520)], fill=(15, 23, 42), width=5)
    d.line([(840, 480), (845, 520)], fill=(15, 23, 42), width=5)
    
    # Little flowers
    for fx, fy, fcol in [(180, 520, (244, 63, 94)), (240, 550, (250, 204, 21)), (650, 510, (236, 72, 153)), (890, 530, (255, 255, 255))]:
        d.ellipse([fx-6, fy-6, fx+6, fy+6], fill=fcol)
        
    save_asset(img, "backgrounds/park.png")

# 11. HOUSE BACKGROUND / BUILDING
def create_house():
    w, h = 1000, 600
    img = Image.new("RGB", (w, h), (186, 230, 253))
    d = ImageDraw.Draw(img)
    
    # Sun & clouds
    d.ellipse([80, 50, 180, 150], fill=(253, 224, 71))
    # Cloud
    d.ellipse([600, 80, 750, 140], fill=(255, 255, 255))
    d.ellipse([650, 60, 720, 110], fill=(255, 255, 255))
    
    # Lawn
    d.rectangle([0, 420, 1000, 600], fill=(74, 222, 128))
    
    # House Body
    d.rounded_rectangle([250, 210, 750, 460], radius=10, fill=(254, 240, 138), outline=(15, 23, 42), width=5)
    
    # Chimney
    d.rectangle([630, 100, 690, 180], fill=(185, 28, 28), outline=(15, 23, 42), width=4)
    # Smoke puffs
    d.ellipse([640, 60, 675, 90], fill=(241, 245, 249, 200))
    d.ellipse([655, 30, 695, 60], fill=(241, 245, 249, 200))
    
    # Pitched Roof
    d.polygon([(210, 220), (500, 80), (790, 220)], fill=(220, 38, 38), outline=(15, 23, 42))
    
    # Windows
    for wx, wy in [(310, 250), (600, 250)]:
        d.rounded_rectangle([wx, wy, wx+90, wy+90], radius=8, fill=(186, 230, 253), outline=(15, 23, 42), width=4)
        d.line([(wx+45, wy), (wx+45, wy+90)], fill=(15, 23, 42), width=3)
        d.line([(wx, wy+45), (wx+90, wy+45)], fill=(15, 23, 42), width=3)
        # Flower box
        d.rounded_rectangle([wx-5, wy+85, wx+95, wy+105], radius=4, fill=(180, 83, 9), outline=(15, 23, 42), width=2)
        d.ellipse([wx+10, wy+80, wx+30, wy+95], fill=(244, 63, 94))
        d.ellipse([wx+40, wy+80, wx+60, wy+95], fill=(234, 179, 8))
        d.ellipse([wx+70, wy+80, wx+90, wy+95], fill=(236, 72, 153))
        
    # Front Door
    d.rounded_rectangle([455, 310, 545, 460], radius=8, fill=(37, 99, 235), outline=(15, 23, 42), width=4)
    d.ellipse([525, 380, 537, 392], fill=(250, 204, 21))  # Doorknob
    
    # Path to Door
    d.polygon([(440, 600), (470, 460), (530, 460), (560, 600)], fill=(226, 232, 240), outline=(148, 163, 184), width=3)
    
    # White picket fence
    for fx in range(30, 230, 35):
        d.rounded_rectangle([fx, 380, fx+20, 450], radius=4, fill=(255, 255, 255), outline=(15, 23, 42), width=2)
    for fx in range(770, 970, 35):
        d.rounded_rectangle([fx, 380, fx+20, 450], radius=4, fill=(255, 255, 255), outline=(15, 23, 42), width=2)
    d.line([(20, 410), (240, 410)], fill=(15, 23, 42), width=4)
    d.line([(760, 410), (980, 410)], fill=(15, 23, 42), width=4)
    
    save_asset(img, "buildings/house.png")

# 12. SCHOOL BACKGROUND / BUILDING
def create_school():
    w, h = 1000, 600
    img = Image.new("RGB", (w, h), (186, 230, 253))
    d = ImageDraw.Draw(img)
    
    # Lawn & Sky
    d.rectangle([0, 440, 1000, 600], fill=(74, 222, 128))
    
    # School Main Building (Brick red)
    d.rounded_rectangle([150, 200, 850, 470], radius=10, fill=(239, 68, 68), outline=(15, 23, 42), width=5)
    
    # Center Tower with Clock
    d.rounded_rectangle([420, 100, 580, 470], radius=8, fill=(220, 38, 38), outline=(15, 23, 42), width=5)
    # Bell/Pinnacle
    d.polygon([(400, 110), (500, 30), (600, 110)], fill=(185, 28, 28), outline=(15, 23, 42), width=4)
    # School Clock
    d.ellipse([465, 120, 535, 190], fill=(255, 255, 255), outline=(15, 23, 42), width=4)
    d.line([(500, 155), (500, 135)], fill=(15, 23, 42), width=3)
    d.line([(500, 155), (515, 155)], fill=(15, 23, 42), width=3)
    
    # Double Entrance Doors
    d.rounded_rectangle([460, 350, 540, 470], radius=6, fill=(120, 53, 15), outline=(15, 23, 42), width=4)
    d.line([(500, 350), (500, 470)], fill=(15, 23, 42), width=3)
    
    # Windows in Rows
    for wx in [200, 270, 340, 620, 690, 760]:
        for wy in [230, 330]:
            d.rounded_rectangle([wx, wy, wx+48, wy+65], radius=6, fill=(224, 242, 254), outline=(15, 23, 42), width=3)
            d.line([(wx+24, wy), (wx+24, wy+65)], fill=(15, 23, 42), width=2)
            d.line([(wx, wy+32), (wx+48, wy+32)], fill=(15, 23, 42), width=2)
            
    # School Sign
    d.rounded_rectangle([440, 230, 560, 270], radius=6, fill=(254, 240, 138), outline=(15, 23, 42), width=3)
    d.rectangle([455, 242, 545, 258], fill=(15, 23, 42))  # text bar
    
    # Courtyard pathway
    d.polygon([(360, 600), (450, 470), (550, 470), (640, 600)], fill=(203, 213, 225), outline=(148, 163, 184), width=3)
    
    save_asset(img, "buildings/school.png")

# 13. STREET BACKGROUND
def create_street():
    w, h = 1000, 600
    img = Image.new("RGB", (w, h), (186, 230, 253))
    d = ImageDraw.Draw(img)
    
    # Skyline of distant city buildings
    buildings = [
        (40, 140, 140, 360, (203, 213, 225)),
        (120, 100, 230, 360, (148, 163, 184)),
        (220, 180, 320, 360, (226, 232, 240)),
        (310, 120, 430, 360, (148, 163, 184)),
        (580, 160, 690, 360, (203, 213, 225)),
        (680, 110, 800, 360, (148, 163, 184)),
        (790, 150, 950, 360, (226, 232, 240)),
    ]
    for x1, y1, x2, y2, col in buildings:
        d.rectangle([x1, y1, x2, y2], fill=col, outline=(100, 116, 139), width=2)
        # Windows
        for wx in range(x1+15, x2-15, 25):
            for wy in range(y1+20, y2-20, 35):
                d.rectangle([wx, wy, wx+12, wy+18], fill=(254, 240, 138))
                
    # Sidewalk curb
    d.rectangle([0, 350, 1000, 430], fill=(203, 213, 225), outline=(100, 116, 139), width=3)
    # Sidewalk lines
    for sx in range(0, 1000, 90):
        d.line([(sx, 350), (sx, 430)], fill=(148, 163, 184), width=2)
        
    # Street Asphalt
    d.rectangle([0, 430, 1000, 600], fill=(51, 65, 85))
    
    # Yellow Dashed Line in Middle
    for dx in range(30, 1000, 110):
        d.rounded_rectangle([dx, 510, dx+60, 525], radius=4, fill=(250, 204, 21))
        
    # Street lamp
    d.line([(880, 220), (880, 400)], fill=(30, 41, 59), width=8)
    d.arc([850, 190, 910, 250], start=180, end=360, fill=(30, 41, 59), width=8)
    d.ellipse([855, 220, 885, 250], fill=(254, 240, 138), outline=(30, 41, 59), width=3)
    
    save_asset(img, "backgrounds/street.png")

create_boy()
create_girl()
create_friend()
create_old_man()
create_dog()
create_cat()
create_red_car()
create_football()
create_tree()
create_park()
create_house()
create_school()
create_street()
print("All 13 assets generated successfully!")
